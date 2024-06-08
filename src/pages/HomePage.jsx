import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Navbar,
  Nav,
  Dropdown,
  ProgressBar,
} from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrediction } from '../redux/prediction/predictionSlice';
import * as tf from '@tensorflow/tfjs';
import './styles.css';

const HomePage = () => {
  const [image, setImage] = useState(null);
  const [output, setOutput] = useState(null);
  const [realScore, setRealScore] = useState(null);
  const [fakeScore, setFakeScore] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const dispatch = useDispatch();
  const predict = useSelector((state) => state.prediction);
  const [imageBase, setImageBase] = useState(null);

  // Function to preprocess the image
  function preprocessImage(image) {
    // Preprocess the image (resize, normalize, etc.)
    return tf.tidy(() => {
      // Expand the dimensions to add the batch size dimension
      const batchedImage = image.expandDims(0);

      // Resize the image to match the input size of the model
      const resizedImage = tf.image.resizeBilinear(batchedImage, [32, 32]); // Thay đổi kích thước theo input_shape của mô hình

      return resizedImage;
    });
  }
  const handleImageChange = (event) => {
    const selectedImage = event.target.files[0];
    setImageBase(selectedImage);
    setImage(URL.createObjectURL(selectedImage));
    setErrorMessage(null);
  };

  const handleImageBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(',')[1]); // Chỉ lấy phần base64 của ảnh
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const resizeImage = (imageBase64, width, height, callback) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${imageBase64}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const resizedImageBase64 = canvas.toDataURL('image/jpeg').split(',')[1];
      callback(resizedImageBase64);
    };
  };

  const handlePredict = async (model, width, height) => {
    try {
      setErrorMessage(null);
      const imageBase64 = await handleImageBase64(imageBase);
      if (imageBase64) {
        resizeImage(imageBase64, width, height, (resizedImageBase64) => {
          dispatch(fetchPrediction({ imageBase64: resizedImageBase64, model }));
        });
      }
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  const handleFakeImageCheck = async (option) => {
    setErrorMessage(null);
    if (!image) {
      setErrorMessage('Vui lòng chọn ảnh trước khi kiểm tra.');
      return;
    }

    setErrorMessage(null);
    const predict = await checkImage(image, option);
    console.log(predict.dataSync()[0]);
    const result = parseFloat(predict.dataSync()[0]);
    setRealScore(result);
    setFakeScore(1 - result);
    result > 0.5
      ? setOutput(`Kết quả kiểm tra: Ảnh thật`)
      : setOutput(`Kết quả kiểm tra: Ảnh giả`);
  };

  const checkImage = async (image, option) => {
    let model;
    switch (option) {
      case 'Option 1':
        model = await tf.loadLayersModel('/models/model_test/model.json');
        break;
      case 'Option 2':
        model = await tf.loadLayersModel('/models/cnn51/model.json');
        break;
      case 'Option 3':
        model = await tf.loadLayersModel('/models/model_test/model.json');
        break;
      default:
        model = await tf.loadLayersModel('/models/model_test/model.json');
        break;
    }
    // console.log(model.summary();
    // Tiền xử lý ảnh (nếu cần thiết)

    // const input = tf.tensor(image, [32, 32] /* prepared image data */);
    const img = new Image();
    img.src = image;

    const input = await preprocessImage(tf.browser.fromPixels(img));
    // Dự đoán
    const output = await model.predict(input);
    return output;
  };

  useEffect(() => {
    if (predict.status === 'succeeded' && predict.data) {
      const realData = predict.data.find(d => d.label === "REAL");
      const fakeData = predict.data.find(d => d.label === "FAKE");
      setRealScore(realData ? realData.score : null);
      setFakeScore(fakeData ? fakeData.score : null);
      const result = realData.score > fakeData.score ? "Ảnh thật" : "Ảnh giả";
      setOutput(`Kết quả kiểm tra: ${result}`);
    } else if (predict.status === 'failed') {
      setErrorMessage(`Error: ${predict.error}`);
    }
  }, [predict]);

  return (
    <Container fluid className="home-container">
      <Navbar
        bg='light'
        expand='lg'
        className='mb-4 d-flex justify-content-between align-items-center'
      >
        <Navbar.Brand href='#'>Trang chủ</Navbar.Brand>
        <Navbar.Toggle aria-controls='basic-navbar-nav' />
        <Navbar.Collapse id='basic-navbar-nav'>
          <Nav className='mr-auto'>
            <Nav.Link href='#'>Cài đặt</Nav.Link>
            <Nav.Link href='#'>Thông tin</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Row className="home-row">
        <Col
          md={6}
          className='d-flex flex-column justify-content-center align-items-center'
        >
          <Form.Group className="file-input">
            <Form.Control
              type='file'
              accept='image/*'
              onChange={handleImageChange}
            />
          </Form.Group>
          {image && (
            <img
              src={image}
              alt='Selected'
              className='img-fluid mt-3 selected-image'
            />
          )}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </Col>

        <Col md={6} className="results-container">
          <div>
            <h4>Kết quả dự đoán:</h4>
            <p>{output}</p>
            {realScore !== null && fakeScore !== null && (
              <div>
                <p>Độ chân thật (REAL): {(realScore * 100).toFixed(2)}%</p>
                <ProgressBar now={realScore * 100} label={`${(realScore * 100).toFixed(2)}%`} />
                <p>Độ giả mạo (FAKE): {(fakeScore * 100).toFixed(2)}%</p>
                <ProgressBar now={fakeScore * 100} label={`${(fakeScore * 100).toFixed(2)}%`} />
              </div>
            )}
            <Dropdown className="mt-3">
              <Dropdown.Toggle variant='primary' id='dropdown-basic'>
                Chọn mô hình và dự đoán
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handlePredict('imagenet', 224, 224)}>
                  ViT - ImageNet_VQDM
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handlePredict('cifake', 32, 32)}>
                  ViT - CIFAKE
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleFakeImageCheck('Option 2')}>
                  CNN
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;
