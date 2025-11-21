// src/app/store.ts
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

// Feature imports
import { authApi } from "../Features/auth/authApi";
import authReducer from "../Features/auth/authSlice";
import themeReducer from "../Features/theme/themeSlice";
import chatReducer from "../Features/ChatSlice/ChatSlice";

// Add your reminder API import
import { reminderApi, activityApi, quizApi, chatApi, uploadApi } from "../Features/auth/authApi";

// Combine all reducers (API reducers + slice reducers)
const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [reminderApi.reducerPath]: reminderApi.reducer, // added reminder API here
  [activityApi.reducerPath]: activityApi.reducer, // added activity API here
  [quizApi.reducerPath]: quizApi.reducer,
  [chatApi.reducerPath]: chatApi.reducer,
  [uploadApi.reducerPath]: uploadApi.reducer,
  auth: authReducer,
  theme: themeReducer,
  chat: chatReducer,
});

// Create a RootState type
export type RootState = ReturnType<typeof rootReducer>;

// Redux Persist configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "theme", "chat"], // reminderApi and activityApi are excluded (API cache shouldn't be persisted)
};

// Wrap root reducer with persist reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        ignoredPaths: [
          'authApi.mutations',
          'authApi.queries',
          'reminderApi.mutations',
          'reminderApi.queries',
          'activityApi.mutations',
          'activityApi.queries',
          'quizApi.mutations',
          'quizApi.queries',
          'chatApi.mutations',
          'chatApi.queries',
          'uploadApi.mutations',
          'uploadApi.queries',
        ],
      },
    })
      .concat(authApi.middleware)
      .concat(reminderApi.middleware) // added reminder API middleware
      .concat(activityApi.middleware) // added activity API middleware
      .concat(quizApi.middleware)
      .concat(chatApi.middleware)
      .concat(uploadApi.middleware),
});

// Create the persistor
export const persistor = persistStore(store);

// Type exports
export type AppDispatch = typeof store.dispatch;
