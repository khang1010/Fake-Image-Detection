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

const HomePage = () => {
  const [image, setImage] = useState(null);
  const [output, setOutput] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleImageChange = (event) => {
    const selectedImage = event.target.files[0];
    setImage(URL.createObjectURL(selectedImage));
    setErrorMessage(null);
  };

  const handleFakeImageCheck = async (option) => {
    if (!image) {
      setErrorMessage('Vui lòng chọn ảnh trước khi kiểm tra.');
      return;
    }

    setErrorMessage(null);
    const prediction = await checkImage(image, option);
    console.log(prediction.dataSync()[0]);
    prediction.dataSync()[0] > 0.5
      ? setOutput(`Kết quả kiểm tra: Ảnh thật`)
      : setOutput(`Kết quả kiểm tra: Ảnh giả`);
  };

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
        model = await tf.loadLayersModel(
          '/src/model/model_test/model.json'
        );
        break;
      case 'Option 2':
        model = await tf.loadLayersModel('/src/model/model_test/model.json');
        break;
      case 'Option 3':
        model = await tf.loadLayersModel('/src/model/model_test/model.json');
        break;
      default:
        model = await tf.loadLayersModel('/src/model/model_test/model.json');
        break;
    }
    // console.log(model.summary());
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
        <Navbar.Brand href='#'>Home</Navbar.Brand>
        <Navbar.Toggle aria-controls='basic-navbar-nav' />
        <Navbar.Collapse id='basic-navbar-nav'>
          <Nav className='mr-auto'>
            <Nav.Link href='#'>Setting</Nav.Link>
            <Nav.Link href='#'>Information</Nav.Link>
            <Nav.Link href='#'>About</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Row>
        <Col
          md={6}
          className='d-flex flex-column justify-content-center align-items-center'
        >
          <Form.Group style={{ padding: '5px' }}>
            <Form.Label>Choose image</Form.Label>
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
            <h4>Check result:</h4>
            <p>{output}</p>
            <Dropdown>
              <Dropdown.Toggle variant='primary' id='dropdown-basic'>
                Check
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => handleFakeImageCheck('Option 1')}>
                  CNN
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleFakeImageCheck('Option 2')}>
                  MobileNet
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleFakeImageCheck('Option 3')}>
                  ...
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
