import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import { persistStore, persistReducer } from "redux-persist";
// Thay thế storage
import createIndexedDBStorage from "redux-persist-indexeddb-storage";

import rootReducer from "./rootReducer";

// Tạo IndexedDB storage engine
const createIdbStorage = createIndexedDBStorage("dev-banhda.vn");

const persistConfig = {
  key: "root",
  storage: createIdbStorage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Tạo store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Bắt buộc khi dùng redux-persist
    }),
});

export const persistor = persistStore(store);

// Type cho RootState và AppDispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// AppSelector và AppDispatch hook
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
