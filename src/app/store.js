// store.js
import { configureStore } from '@reduxjs/toolkit';
import predictionReducer from '../redux/prediction/predictionSlice';

const store = configureStore({
  reducer: {
    prediction: predictionReducer,
  },
});

export default store;
