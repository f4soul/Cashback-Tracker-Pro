import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { MonthData, Bank, AppSettings, PlaceholderUser } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface UseCloudSyncProps {
  user: FirebaseUser | PlaceholderUser | null;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  allData: MonthData[];
  setAllData: (data: MonthData[]) => void;
  customBanks: Bank[];
  setCustomBanks: (banks: Bank[]) => void;
  deletedCustomBanks: Bank[];
  setDeletedCustomBanks: (banks: Bank[]) => void;
  customCategories: string[];
  setCustomCategories: (categories: string[]) => void;
}

export function useCloudSync({
  user,
  theme,
  setTheme,
  settings,
  setSettings,
  allData,
  setAllData,
  customBanks,
  setCustomBanks,
  deletedCustomBanks,
  setDeletedCustomBanks,
  customCategories,
  setCustomCategories,
}: UseCloudSyncProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitialSync, setHasInitialSync] = useState(false);

  const debounceTimers = useRef<{ settings?: any; month?: any }>({});
  const activeWrites = useRef<{ settings: boolean; month: boolean }>({ settings: false, month: false });
  const isMounted = useRef(true);
  const hasUploadedLocalRef = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounceTimers.current.settings) clearTimeout(debounceTimers.current.settings);
      if (debounceTimers.current.month) clearTimeout(debounceTimers.current.month);
    };
  }, []);

  // Sync settings and custom data from Firestore
  useEffect(() => {
    if (!user || 'isPlaceholder' in user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;
        
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.settings) setSettings(data.settings);
          if (data.theme) setTheme(data.theme);
          if (data.customBanks) setCustomBanks(data.customBanks);
          if (data.customCategories) setCustomCategories(data.customCategories);
          if (data.deletedCustomBanks) setDeletedCustomBanks(data.deletedCustomBanks);
        } else {
          // Initialize user document if it doesn't exist with local data
          const initialUserData = JSON.parse(
            JSON.stringify({
              settings,
              theme,
              customBanks,
              deletedCustomBanks,
              customCategories,
            }),
          );

          setDoc(userDocRef, initialUserData).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`),
          );
        }
      },
      (err) =>
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`),
    );

    return () => unsubscribe();
  }, [user]);

  // Sync month data from Firestore
  useEffect(() => {
    if (!user || 'isPlaceholder' in user) return;

    const monthsQuery = query(
      collection(db, 'months'),
      where('uid', '==', user.uid),
    );
    const unsubscribe = onSnapshot(
      monthsQuery,
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites) return;

        if (snapshot.empty && allData.length > 0 && !hasUploadedLocalRef.current) {
          hasUploadedLocalRef.current = true;
          // First time user with local data - upload it
          allData.forEach((month) => {
            const monthDocId = `${user.uid}_${month.monthId}`;
            // Sanitize entries to remove undefined values
            const sanitizedEntries = JSON.parse(
              JSON.stringify(month.entries || []),
            );

            setDoc(doc(db, 'months', monthDocId), {
              monthId: month.monthId,
              entries: sanitizedEntries,
              uid: user.uid,
            }).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, 'months'),
            );
          });
        } else if (!snapshot.empty) {
          const months: MonthData[] = snapshot.docs.map((doc) => ({
            monthId: doc.data().monthId,
            entries: doc.data().entries || [],
          }));
          setAllData(months);
        }
        setHasInitialSync(true);
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'months'),
    );

    return () => unsubscribe();
  }, [user]);

  // Helper to save data to Firestore with debounce (500ms) and independent timers
  const saveToFirestore = useCallback(
    (type: 'settings' | 'month', payload: any) => {
      if (!user || 'isPlaceholder' in user) return;

      // Clear any pending timer of this type
      if (debounceTimers.current[type]) {
        clearTimeout(debounceTimers.current[type]);
      }

      setIsSyncing(true);

      debounceTimers.current[type] = setTimeout(async () => {
        // Clear the timer from ref as it is now executing
        debounceTimers.current[type] = undefined;
        activeWrites.current[type] = true;
        if (isMounted.current) {
          setIsSyncing(true);
        }

        try {
          // Sanitize payload to remove undefined values which Firestore doesn't support
          const sanitizedPayload = JSON.parse(JSON.stringify(payload));

          if (type === 'settings') {
            await setDoc(doc(db, 'users', user.uid), sanitizedPayload, {
              merge: true,
            });
          } else if (type === 'month') {
            const monthDocId = `${user.uid}_${payload.monthId}`;
            await setDoc(doc(db, 'months', monthDocId), {
              monthId: payload.monthId,
              entries: sanitizedPayload.entries || [],
              uid: user.uid,
            });
          }
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.WRITE,
            type === 'settings' ? `users/${user.uid}` : 'months',
          );
        } finally {
          activeWrites.current[type] = false;
          // Only stop syncing if no timers are pending and no writes are active
          if (
            !debounceTimers.current.settings &&
            !debounceTimers.current.month &&
            !activeWrites.current.settings &&
            !activeWrites.current.month
          ) {
            if (isMounted.current) {
              setIsSyncing(false);
            }
          }
        }
      }, 500);
    },
    [user],
  );

  const handleExportAllData = useCallback(() => {
    const exportData = {
      allData,
      customBanks,
      deletedCustomBanks,
      customCategories,
      settings,
      theme,
      version: '1.0',
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cashback_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [allData, customBanks, deletedCustomBanks, customCategories, settings, theme]);

  const handleImportAllData = useCallback(
    async (jsonData: any) => {
      try {
        if (!jsonData.allData || !Array.isArray(jsonData.allData)) {
          throw new Error('Invalid backup format');
        }

        setAllData(jsonData.allData);
        if (jsonData.customBanks) setCustomBanks(jsonData.customBanks);
        if (jsonData.deletedCustomBanks) setDeletedCustomBanks(jsonData.deletedCustomBanks);
        if (jsonData.customCategories)
          setCustomCategories(jsonData.customCategories);
        if (jsonData.settings) setSettings(jsonData.settings);
        if (jsonData.theme) setTheme(jsonData.theme);

        // If logged in, sync to Firestore
        if (user && !('isPlaceholder' in user)) {
          setIsSyncing(true);
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(
            userDocRef,
            {
              settings: jsonData.settings || settings,
              theme: jsonData.theme || theme,
              customBanks: jsonData.customBanks || customBanks,
              deletedCustomBanks: jsonData.deletedCustomBanks || deletedCustomBanks,
              customCategories: jsonData.customCategories || customCategories,
              uid: user.uid,
            },
            { merge: true },
          );

          // Sync months using batch write
          const batch = writeBatch(db);
          for (const month of jsonData.allData) {
            const monthDocId = `${user.uid}_${month.monthId}`;
            const ref = doc(db, 'months', monthDocId);
            batch.set(ref, {
              monthId: month.monthId,
              entries: month.entries,
              uid: user.uid,
            });
          }
          await batch.commit();
          setIsSyncing(false);
        }
        return true;
      } catch (error) {
        console.error('Import error:', error);
        setIsSyncing(false);
        throw error;
      }
    },
    [
      user,
      settings,
      theme,
      customBanks,
      deletedCustomBanks,
      customCategories,
      setAllData,
      setCustomBanks,
      setDeletedCustomBanks,
      setCustomCategories,
      setSettings,
      setTheme,
    ],
  );

  return {
    saveToFirestore,
    isSyncing,
    hasInitialSync,
    handleImportAllData,
    handleExportAllData,
  };
}
