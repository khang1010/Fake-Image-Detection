import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Navbar,
  Nav,
  Dropdown,
} from 'react-bootstrap';
import * as tf from '@tensorflow/tfjs';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPrediction } from '../redux/prediction/predictionSlice';

const HomePage = () => {
  const [image, setImage] = useState(null);
  const [output, setOutput] = useState(null);
  const [result, setResult] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const dispatch = useDispatch();
  const predict = useSelector((state) => state.prediction);
  const [imageBase, setImageBase] = useState(null);

  const handleImageChange = (event) => {
    const selectedImage = event.target.files[0];
    setImageBase(selectedImage);
    setImage(URL.createObjectURL(selectedImage));
    setErrorMessage(null);
  };

  const handleFakeImageCheck = async (option) => {
    if (!image) {
      setErrorMessage('Vui lòng chọn ảnh trước khi kiểm tra.');
      return;
    }

    setErrorMessage(null);
    const predict = await checkImage(image, option);
    console.log(predict.dataSync()[0]);
    const result = parseFloat(predict.dataSync()[0]);
    setPrediction(result);
    result > 0.5
      ? setOutput(`Kết quả kiểm tra: Ảnh thật`)
      : setOutput(`Kết quả kiểm tra: Ảnh giả`);
  };

  const handleImageChange2 = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleImageBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const resizeImage = (imageBase64, callback) => {
    const img = new Image();
    img.src = imageBase64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 32;
      canvas.height = 32;
      ctx.drawImage(img, 0, 0, 32, 32);
      const resizedImageBase64 = canvas.toDataURL('image/jpeg');
      callback(resizedImageBase64);
    };
  };

  // const handlePredict = async () => {
  //   try {
  //     const imageBase64 = await handleImageBase64(imageBase);
  //     if (imageBase64) {
  //       const base64Image = imageBase64.split(',')[1];
  //       dispatch(fetchPrediction(base64Image));
  //     }
  //   } catch (error) {
  //     console.error("Error processing image:", error);
  //   }
  // };

  const handlePredict = async (model) => {
    try {
      const imageBase64 = await handleImageBase64(imageBase);
      if (imageBase64) {
        resizeImage(imageBase64, (resizedImageBase64) => {
          const base64Image = resizedImageBase64.split(',')[1];
          dispatch(fetchPrediction({base64Image, model}));
        });
      }
    } catch (error) {
      console.error("Error processing image:", error);
    }
  };

  useEffect(() => {
    if (predict.status === 'succeeded' && predict.data) {
      const result = predict.data[0].score < predict.data[1].score ? `Kết quả kiểm tra: ${predict.data[1].label}` : `Kết quả kiểm tra: ${predict.data[0].label}`;
      setOutput(result);
      setPrediction(predict.data[1].score);
    } else if (predict.status === 'failed') {
      setErrorMessage(`Error: ${predict.error}`);
    }
  }, [predict]);

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

  return (
    <Container fluid style={{ margin: 0, padding: 0 }}>
      <Navbar
        bg='light'
        expand='lg'
        className='mb-4 d-flex justify-content-between align-items-center'
        style={{ padding: '10px' }}
      >
        <Navbar.Brand href='#'>Trang chủ</Navbar.Brand>
        <Navbar.Toggle aria-controls='basic-navbar-nav' />
        <Navbar.Collapse id='basic-navbar-nav'>
          <Nav className='mr-auto'>
            <Nav.Link href='#'>Cài đặt</Nav.Link>
            <Nav.Link href='#'>Thông tin</Nav.Link>
            {/* <Nav.Link href='#'>About</Nav.Link> */}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Row>
        <Col
          md={6}
          className='d-flex flex-column justify-content-center align-items-center'
        >
          <Form.Group style={{ padding: '5px' }}>
            {/* <Form.Label>Chọn ảnh</Form.Label> */}
            <Form.Control
              type='file'
              accept='image/*'
              onChange={handleImageChange}
              style={{ marginTop: '9px' }}
            />
          </Form.Group>
          {image && (
            <img
              src={image}
              alt='Selected'
              className='img-fluid mt-3'
              style={{ maxWidth: '320px', maxHeight: '320px' }}
            />
          )}
          {errorMessage && <p>{errorMessage}</p>}
        </Col>

        <Col md={6}>
          <div>
            <h4>Kết quả dự đoán:</h4>
            <p>{output}</p>
            <p>{prediction ? `Độ chân thật: ${(prediction * 100).toFixed(2)}%`: ''}</p>
            <Dropdown>
              <Dropdown.Toggle variant='primary' id='dropdown-basic'>
                Chọn mô hình và dự đoán
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handlePredict('imagenet')}>
                  ViT - ImageNet_VQDM
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handlePredict('cifake')}>
                  ViT - CIFAKE
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handlePredict('progan')}>
                  ViT - ProGAN
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
