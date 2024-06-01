// predictionSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;

// Thunk để gọi API của Hugging Face
export const fetchPrediction = createAsyncThunk(
  'prediction/fetchPrediction',
  async (imageBase64, thunkAPI) => {
    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/ongtrandong2/ai_vs_real_image_detection',
        { inputs: imageBase64 },
        {
          headers: {
            Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.data.error && response.data.error.includes('currently loading')) {
        throw new Error('Model is currently loading. Please try again in a few moments.');
      }
      console.log(response.data);
      return response.data;
    } catch (error) {
        console.log(error.message);
      return thunkAPI.rejectWithValue(error.message);
    }
  }
);

const predictionSlice = createSlice({
  name: 'prediction',
  initialState: {
    data: null,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPrediction.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPrediction.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload;
      })
      .addCase(fetchPrediction.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default predictionSlice.reducer;
