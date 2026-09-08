import { useEffect } from "react";
import { BANKS } from "../constants";
import { Bank } from "../types";

export function useLogoPreloader(customBanks: Bank[]) {
  useEffect(() => {
    // We only want to preload on the client side, and ideally with some delay
    // so we don't block the initial render/load of the page.
    const preloadTimer = setTimeout(() => {
      const preloadImage = (url: string | undefined) => {
        if (!url) return;
        const img = new Image();
        img.src = url;
      };

      // Preload standard bank logos
      BANKS.forEach((bank) => {
        preloadImage(bank.logoUrl);
      });

      // Preload custom bank logos
      customBanks.forEach((bank) => {
        preloadImage(bank.logoUrl);
      });
    }, 1000);

    return () => clearTimeout(preloadTimer);
  }, [customBanks]);
}
