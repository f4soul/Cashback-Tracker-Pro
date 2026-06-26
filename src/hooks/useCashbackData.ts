import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { MonthData, Bank, PlaceholderUser } from '../types';
import { getCurrentMonthId } from '../utils/date';
import { BANKS } from '../constants';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

export function useCashbackData(
  user: FirebaseUser | PlaceholderUser | null,
  hasInitialSync: boolean | (() => boolean),
  saveToFirestore?: (type: 'settings' | 'month', payload: any) => void,
) {
  const currentMonthId = getCurrentMonthId();
  const [selectedMonthId, setSelectedMonthId] = useState(currentMonthId);

  // Helper to evaluate hasInitialSync
  const getIsInitialSync = useCallback(() => {
    if (typeof hasInitialSync === 'function') {
      return hasInitialSync();
    }
    return hasInitialSync;
  }, [hasInitialSync]);

  // Local storage as fallback/initial state
  const [allData, setAllData] = useLocalStorage<MonthData[]>(
    'cashback_data',
    [],
  );
  const [customBanks, setCustomBanks] = useLocalStorage<Bank[]>(
    'custom_banks',
    [],
  );
  const [deletedCustomBanks, setDeletedCustomBanks] = useLocalStorage<Bank[]>(
    'deleted_custom_banks',
    [],
  );
  const [customCategories, setCustomCategories] = useLocalStorage<string[]>(
    'custom_categories',
    [],
  );

  // Derivations
  const currentMonthData = useMemo(
    () =>
      allData.find((d) => d.monthId === selectedMonthId) || {
        monthId: selectedMonthId,
        entries: [],
      },
    [allData, selectedMonthId],
  );

  const archiveData = useMemo(
    () =>
      allData
        .filter((d) => d.monthId !== currentMonthId)
        .sort((a, b) => b.monthId.localeCompare(a.monthId)),
    [allData, currentMonthId],
  );

  // Initialize selected month if not in allData
  useEffect(() => {
    if (!allData.find((d) => d.monthId === selectedMonthId)) {
      setAllData((prev) => [
        ...prev,
        { monthId: selectedMonthId, entries: [] },
      ]);
    }
  }, [selectedMonthId, allData, setAllData]);

  // Completely clear any remembered deleted custom banks once to start fresh
  useEffect(() => {
    const isSynced = getIsInitialSync();
    if (user && !isSynced) return;
    if (deletedCustomBanks.length > 0) {
      setDeletedCustomBanks([]);
      if (user) {
        saveToFirestore?.('settings', { deletedCustomBanks: [] });
      }
    }
  }, [getIsInitialSync, user, deletedCustomBanks.length, setDeletedCustomBanks, saveToFirestore]);

  // CRUD Operations
  const handleUpdateCurrentMonth = useCallback(
    (updatedData: MonthData) => {
      setAllData((prev) => {
        const exists = prev.find((d) => d.monthId === updatedData.monthId);
        if (exists) {
          return prev.map((d) =>
            d.monthId === updatedData.monthId ? updatedData : d,
          );
        } else {
          return [...prev, updatedData];
        }
      });
      if (user) {
        saveToFirestore?.('month', updatedData);
      }
    },
    [user, saveToFirestore, setAllData],
  );

  const deleteMonthEntry = useCallback(
    (monthId: string, entryId: string) => {
      const updatedMonth = allData.find((m) => m.monthId === monthId);
      if (!updatedMonth) return;

      const newEntries = updatedMonth.entries.filter((e) => e.id !== entryId);
      const newMonthData = { ...updatedMonth, entries: newEntries };

      setAllData((prev) =>
        prev.map((month) => (month.monthId === monthId ? newMonthData : month)),
      );

      if (user) {
        saveToFirestore?.('month', newMonthData);
      }
    },
    [allData, user, saveToFirestore, setAllData],
  );

  const handleDeleteMonth = useCallback(
    (monthId: string) => {
      setAllData((prev) => prev.filter((m) => m.monthId !== monthId));

      if (user) {
        const monthDocId = `${user.uid}_${monthId}`;
        deleteDoc(doc(db, 'months', monthDocId)).catch((err) =>
          handleFirestoreError(
            err,
            OperationType.DELETE,
            `months/${monthDocId}`,
          ),
        );
      }
    },
    [user, setAllData],
  );

  const handleDeleteCustomBank = useCallback(
    (bankId: string) => {
      const bankToBackup = customBanks.find((b) => b.id === bankId);
      const newBanks = customBanks.filter((b) => b.id !== bankId);
      setCustomBanks(newBanks);

      let nextDeleted = deletedCustomBanks;
      if (bankToBackup && !deletedCustomBanks.some((b) => b.id === bankId)) {
        nextDeleted = [...deletedCustomBanks, bankToBackup];
        setDeletedCustomBanks(nextDeleted);
      }

      if (user) {
        saveToFirestore?.('settings', {
          customBanks: newBanks,
          deletedCustomBanks: nextDeleted,
        });
      }
    },
    [customBanks, deletedCustomBanks, user, saveToFirestore, setCustomBanks, setDeletedCustomBanks],
  );

  const handleAddCustomBank = useCallback(
    (bank: Bank) => {
      if (!customBanks.find((b) => b.id === bank.id)) {
        const newBanks = [...customBanks, bank];
        setCustomBanks(newBanks);
        if (user) {
          saveToFirestore?.('settings', { customBanks: newBanks });
        }
      }
    },
    [customBanks, user, saveToFirestore, setCustomBanks],
  );

  const handleAddCustomCategory = useCallback(
    (category: string) => {
      if (!customCategories.includes(category)) {
        const newCategories = [...customCategories, category];
        setCustomCategories(newCategories);
        if (user) {
          saveToFirestore?.('settings', { customCategories: newCategories });
        }
      }
    },
    [customCategories, user, saveToFirestore, setCustomCategories],
  );

  return {
    selectedMonthId,
    setSelectedMonthId,
    allData,
    setAllData,
    customBanks,
    setCustomBanks,
    deletedCustomBanks,
    setDeletedCustomBanks,
    customCategories,
    setCustomCategories,
    currentMonthData,
    archiveData,
    handleUpdateCurrentMonth,
    deleteMonthEntry,
    handleDeleteMonth,
    handleDeleteCustomBank,
    handleAddCustomBank,
    handleAddCustomCategory,
  };
}
