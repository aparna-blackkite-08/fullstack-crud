import { useRouter } from "components/compat/router";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col } from "components/compat/bootstrap";
import s from "./Team.module.scss";
import Head from "components/compat/Head";

interface Photo {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
}

const API_URL = "http://localhost:8080/api/photos";

const Index = () => {
  const router = useRouter();

  // Check whether the user is logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  // Form values
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

   // Preview of the selected photo
  const [preview, setPreview] = useState("");

  // Photos retrieved from the backend
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Loading and error messages
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  
  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      setSelectedPhoto(null);
      setPreview("");
      event.target.value = "";
      return;
    }

    // Optional size limit: 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be 5 MB or less.");
      setSelectedPhoto(null);
      setPreview("");
      event.target.value = "";
      return;
    }

    setSelectedPhoto(file);
    setPreview(URL.createObjectURL(file));
    setMessage("");
  };
  
  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title.trim() || !description.trim() || !selectedPhoto) {
      setMessage("Please enter a title, description, and select a photo.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("photo", selectedPhoto);

    // const formValues = Object.fromEntries(formData.entries());
    // console.log(formValues);
    
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers:{
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Photo upload failed.");
      }

      setTitle("");
      setDescription("");
      setSelectedPhoto(null);
      setPreview("");

      setMessage("Photo uploaded successfully.");
    } catch(error) {
      console.error("Error uploading photo:", error);
      setMessage("Photo upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  },[preview]);

  return (
    <>
      <Head>
        <title>Photo Upload</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta
          name="description"
          content="Upload, view and manage your photos."
        />
      </Head>

      <Container
        className={`${s.teamContainer} mb-5`}
        style={{ marginTop: 32 }}
      >
        <Row>
          <Col xs={12}>
            <h3 className={`${s.pageTitle} fw-bold`}>
              Photo Upload
            </h3>
            <p className={s.mutedText}>
              Upload your photos with a title and description.
            </p>
          </Col>
        </Row>

        {/* Photo upload form */}
        <Row className="mt-4">
          <Col lg={8} md={10} xs={12}>
            <div className={s.uploadCard}>
              <h5 className="fw-bold mb-4">Add New Photo</h5>

              <form onSubmit={handleUpload}>
                <div className={s.formGroup}>
                  <label htmlFor="photoTitle">Photo Title</label>
                  <input
                    id="photoTitle"
                    type="text"
                    className={s.formControl}
                    placeholder="Enter photo title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={100}
                    required
                  />
                </div>

                <div className={s.formGroup}>
                  <label htmlFor="photoDescription">Description</label>
                  <textarea
                    id="photoDescription"
                    className={s.formControl}
                    placeholder="Write something about this photo"
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={4}
                    maxLength={1000}
                    required
                  />
                </div>

                <div className={s.formGroup}>
                  <label htmlFor="photoFile">Choose Photo</label>
                  <input
                    id="photoFile"
                    type="file"
                    className={s.formControl}
                    accept="image/*"
                    onChange={handlePhotoChange}
                    required={!selectedPhoto}
                  />
                  <small className={s.helpText}>
                    Image files only. Maximum size: 5 MB.
                  </small>
                </div>

                {preview && (
                  <div className={s.previewContainer}>
                    <p className="fw-bold">Photo Preview</p>
                    <img
                      src={preview}
                      alt="Selected photo preview"
                      className={s.previewImage}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className={s.uploadButton}
                  disabled={loading}
                >
                  {loading ? "Uploading..." : "Upload Photo"}
                </button>
              </form>

              {message && (
                <p className={s.message} role="status">
                  {message}
                </p>
              )}
            </div>
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
