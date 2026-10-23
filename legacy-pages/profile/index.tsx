import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
} from "components/compat/bootstrap";
import img from "public/images/e-commerce/contact/img.png";

import s from "./Profile.module.scss";
import InstagramWidget from "components/e-commerce/Instagram";
import Head from "components/compat/Head";
import axios from "axios";

const Index = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          setMessage("Please log in to view your profile.");
          return;
        }

        const response = await axios.get(
          "http://localhost:8080/api/auth/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );

        setName(response.data.user.name);
        setEmail(response.data.user.email);
      } catch (error) {
        setMessage("Unable to load profile. Please log in again.");
      }
    };
    fetchProfile();
  }, []);

  const updateForm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please log in first.");
      return;
    }

    const response = await axios.put(
      "http://localhost:8080/api/auth/profile",
      {
        name,
        email,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setName(response.data.user.name);
    setEmail(response.data.user.email);
    setMessage(response.data.message);    
  };

  return (
    <>
      <Head>
        <title>My Profile</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />

        <meta
          name="description"
          content="Beautifully designed web application template built with React and Bootstrap to create modern apps and speed up development"
        />
        <meta name="keywords" content="flatlogic, react templates" />
        <meta name="author" content="Flatlogic LLC." />
        <meta charSet="utf-8" />

        <meta
          property="og:title"
          content="Flatlogic - React, Vue, Angular and Bootstrap Templates and Admin Dashboard Themes"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content="https://flatlogic-ecommerce.herokuapp.com/"
        />
        <meta
          property="og:image"
          content="https://flatlogic-ecommerce-backend.herokuapp.com/images/blogs/content_image_six.jpg"
        />
        <meta
          property="og:description"
          content="Beautifully designed web application template built with React and Bootstrap to create modern apps and speed up development"
        />
        <meta name="twitter:card" content="summary_large_image" />

        <meta property="fb:app_id" content="712557339116053" />

        <meta property="og:site_name" content="Flatlogic" />
        <meta name="twitter:site" content="@flatlogic" />
      </Head>
      <Container className={s.contactContainer}>
        <Row className={"mb-5"} style={{ marginTop: 32 }}>
          <Col
            lg={6}
            sm={12}
            className="d-flex flex-column justify-content-center"
          >
            <div>
              <h2 className={`${s.pageTitle} fw-bold`}>My Profile</h2>
              {/* <h6 className={s.mutedText}>
                If you have any questions please fill out the form
              </h6> */}
            </div>
            <Form onSubmit={updateForm}>
              <FormGroup>
                <Label for="name" className={`${s.formLabel} fw-bold`}>
                  Name
                </Label>
                <Input
                  type="text"
                  name="text"
                  id="name"
                  className={`${s.formControl} w-100`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormGroup>
              <FormGroup className="d-flex">
                <div className={`${s.emailField} flex-fill`}>
                  <Label
                    for="email"
                    className={`${s.formLabel} fw-bold`}
                  >
                    Email
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="exampleEmail1"
                    className={s.formControl}
                    required
                  />
                </div>
              </FormGroup>              
              <FormGroup>
                <Button
                  color="primary"
                  className={`${s.submitButton} text-uppercase fw-bold align-self-start`}
                  type={"submit"}
                  // onClick={updateForm}
                >
                  Update Profile
                </Button>
              </FormGroup>
            </Form>
          </Col>
          <Col lg={6} sm={12} className={s.contactVisual}>
            <img src={img} alt="" />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export async function getServerSideProps(_context: unknown) {
  // const res = await axios.get("/products");
  // const products = res.data.rows;

  return {
    props: {}, // will be passed to the page component as props
  };
}

export default Index;
