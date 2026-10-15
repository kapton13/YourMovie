"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false — компонент ще «оживлює» HTML із сервера (тоді він мусить показати те саме, що сервер),
 * true — уже в браузері. Потрібно для блоків, що приходять пізніше за спільний стан
 * (користувач, списки, «Не цікаво»): інакше React бачить розбіжність і перемальовує весь блок.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
