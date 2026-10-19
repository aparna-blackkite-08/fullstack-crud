
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container, Row, Col } from "components/compat/bootstrap";
import Head from "components/compat/Head";
import s from "./Team.module.scss";
import { FaHeart, FaRegHeart, FaPaperPlane } from "react-icons/fa";

interface PhotoComment {
  _id: string;
  text: string;
  createdAt: string;
  user: {
    _id: string;
    name: string;
  } | string;
}

interface Photo {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  uploadedBy?: string;
  likes: string[];
  comments: PhotoComment[];
}

const API_URL = "http://localhost:8080/api/photos";
const IMAGE_BASE_URL = "http://localhost:8080";
const PHOTOS_PER_PAGE = 6;

const Index = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  //search and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [likingId, setLikingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const [commentInputs, setCommentInputs] = useState<
  Record<string, string>
>({});
  const [commentingId, setCommentingId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return;
    }

    try {
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
      );

      if (typeof payload.userId === "string") {
        setCurrentUserId(payload.userId);
      }
    } catch (error) {
      console.error("Could not read the logged-in user ID:", error);
    }
  }, []);

  // Get all photos from the backend
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await axios.get<{ photos: Photo[] }>(API_URL);

      console.log("Logged-in user ID:", currentUserId);
      console.log("Photos received from backend:", response.data.photos);
      
      setPhotos(response.data.photos);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setMessage("Could not load photos. Please check the backend.");
    } finally {
      setLoading(false);
    }
  };

  // Run once when this page opens
  useEffect(() => {
    fetchPhotos();
  }, []);

// Search by title OR description
  const filteredPhotos = photos.filter((photo) => {
    const searchText = searchTerm.trim().toLowerCase();

    return (
      photo.title.toLowerCase().includes(searchText) ||
      photo.description.toLowerCase().includes(searchText)
    );
  });

  // console.log("filteredPhotos ==> ", filteredPhotos);
  

  // Calculate total pages after filtering
  const totalPages = Math.ceil(
    filteredPhotos.length / PHOTOS_PER_PAGE
  );

  // console.log(totalPages);
  

  // Keep current page valid if photos are deleted
  useEffect(() => {
    if (currentPage > Math.max(1, totalPages)) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  // Get only the photos for the current page
  const startIndex = (currentPage - 1) * PHOTOS_PER_PAGE;

  const currentPhotos = filteredPhotos.slice(
    startIndex,
    startIndex + PHOTOS_PER_PAGE
  );

  // console.log("startIndex ==>", startIndex);
  // console.log("currentPhotos  => ", currentPhotos);

  // Delete one photo
  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please log in to delete your photo.");
      return;
    }

    const photo = photos.find((item) => item._id === id);

    // Frontend check: only allow the owner to delete
    if (!photo || photo.uploadedBy !== currentUserId) {
      setMessage("You can only delete your own photos.");
      return;
    }
    
    const confirmed = window.confirm(
      "Are you sure you want to delete this photo?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setMessage("");

      await axios.delete(`${API_URL}/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPhotos((currentPhotos) =>
        currentPhotos.filter((photo) => photo._id !== id)
      );

      setMessage("Photo deleted successfully.");
    } catch (error) {
      console.error("Error deleting photo:", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setMessage("You can only delete your own photos.");
      } else if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        setMessage("Please log in again to delete your photo.");
      } else {
        setMessage("Could not delete the photo.");
      }
    } finally {
      setDeletingId(null);
    }
  };
  
  const handleLike = async (photoId: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please log in to like a photo.");
      return;
    }

    try {
      setLikingId(photoId);
      setMessage("");

      const response = await axios.patch(
        `${API_URL}/${photoId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedPhoto: Photo = response.data.photo;

      // Update only the photo that was liked or unliked
      setPhotos((previousPhotos) =>
        previousPhotos.map((photo) =>
          photo._id === photoId ? updatedPhoto : photo
        )
      );
    } catch (error) {
      console.error("Error updating photo like:", error);
      setMessage("Could not update the like. Please try again.");
    } finally {
      setLikingId(null);
    }
  };

  
  const handleAddComment = async (photoId: string) => {
    const token = localStorage.getItem("token");
    const text = (commentInputs[photoId] || "").trim();
    console.log("text ==> ",text);

    if (!token) {
      setMessage("Please log in to add a comment.");
      return;
    }

    if (!text) {
      return;
    }

    try {
      setCommentingId(photoId);
      setMessage("");

      const response = await axios.post(
        `${API_URL}/${photoId}/comments`,
        { text },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedPhoto: Photo = response.data.photo;

      // Update the photo and its comments on the page
      setPhotos((previousPhotos) =>
        previousPhotos.map((photo) =>
          photo._id === photoId ? updatedPhoto : photo
        )
      );

      // Clear this photo's input after successful submission
      setCommentInputs((previousInputs) => ({
        ...previousInputs,
        [photoId]: "",
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
      setMessage("Could not add comment. Please try again.");
    } finally {
      setCommentingId(null);
    }
  };

  // Change search text and return to page 1
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <>
      <Head>
        <title>Photos</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <Container
        className={`${s.teamContainer} mb-5`}
        style={{ marginTop: 32 }}
      >
        <Row>
          <Col xs={12}>
            <h3 className={`${s.pageTitle} fw-bold`}>
              My Photos
            </h3>

            <p>View, search, and manage your uploaded photos.</p>

            {/* Search input */}
            <div style={{ marginBottom: 24, maxWidth: 500 }}>
              <label
                htmlFor="photoSearch"
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                }}
              >
                Search photos
              </label>

              <input
                id="photoSearch"
                type="text"
                className="form-control"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(event) =>
                  handleSearch(event.target.value)
                }
              />
            </div>

            {message && (
              <p role="status">{message}</p>
            )}

            {loading ? (
              <p>Loading photos...</p>
            ) : filteredPhotos.length === 0 ? (
              <p>
                {searchTerm.trim()
                  ? "No photos match your search."
                  : "No photos found. Upload your first photo!"}
              </p>
            ) : (
              <>
                {/* Results information */}
                <p>
                  Showing {startIndex + 1}–
                  {Math.min(
                    startIndex + PHOTOS_PER_PAGE,
                    filteredPhotos.length
                  )}{" "}
                  of {filteredPhotos.length} photos
                </p>

                {/* Photo cards */}
                <Row>
                  {currentPhotos.map((photo) => (
                    <Col
                      xs={12}
                      md={6}
                      lg={4}
                      key={photo._id}
                    >
                      <div
                        style={{
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          padding: 16,
                          marginBottom: 24,
                          height: "calc(100% - 24px)",
                        }}
                      >
                        <img
                          src={`${IMAGE_BASE_URL}${photo.imageUrl}`}
                          alt={photo.title}
                          style={{
                            width: "100%",
                            height: 220,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />

                        <h5 style={{ marginTop: 12 }}>
                          {photo.title}
                        </h5>

                        <p>{photo.description}</p>

                        {/* Like and Unlike button */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 16,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleLike(photo._id)}
                            disabled={likingId === photo._id}
                            aria-label={
                              (photo.likes ?? []).some(
                                (id) => String(id) === currentUserId
                              )
                                ? "Unlike photo"
                                : "Like photo"
                            }
                            aria-pressed={(photo.likes ?? []).some(
                              (id) => String(id) === currentUserId
                            )}
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 4,
                              cursor: likingId === photo._id ? "wait" : "pointer",
                              opacity: likingId === photo._id ? 0.6 : 1,
                            }}
                          >
                            {(photo.likes ?? []).some(
                              (id) => String(id) === currentUserId
                            ) ? (
                              <FaHeart size={26} color="red" />
                            ) : (
                              <FaRegHeart size={26} color="#777" />
                            )}
                          </button>

                          <span>
                            {(photo.likes ?? []).length}
                            {" "}
                            {(photo.likes ?? []).length === 1 ? "Like" : "Likes"}
                          </span>
                        </div>

                        {/* Comments section */}
                        <div
                          style={{
                            borderTop: "1px solid #eee",
                            paddingTop: 16,
                            marginTop: 8,
                            marginBottom: 16,
                          }}
                        >
                          <h6 style={{ fontWeight: 600, marginBottom: 12 }}>
                            Comments ({(photo.comments ?? []).length})
                          </h6>

                          {/* Comment input and send icon */}
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              handleAddComment(photo._id);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginBottom: 16,
                            }}
                          >
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Write a comment..."
                              aria-label={`Write a comment on ${photo.title}`}
                              value={commentInputs[photo._id] || ""}
                              maxLength={1000}
                              onChange={(event) =>
                                setCommentInputs((previousInputs) => ({
                                  ...previousInputs,
                                  [photo._id]: event.target.value,
                                }))
                              }
                              disabled={commentingId === photo._id}
                            />

                            <button
                              type="submit"
                              aria-label="Send comment"
                              title="Send comment"
                              disabled={
                                commentingId === photo._id ||
                                !(commentInputs[photo._id] || "").trim()
                              }
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#0d6efd",
                                padding: 8,
                                cursor: "pointer",
                                opacity:
                                  commentingId === photo._id ||
                                  !(commentInputs[photo._id] || "").trim()
                                    ? 0.5
                                    : 1,
                              }}
                            >
                              <FaPaperPlane size={20} />
                            </button>
                          </form>

                          {/* Display all comments */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {(photo.comments ?? []).map((comment) => {
                              const userName =
                                typeof comment.user === "object"
                                  ? comment.user.name
                                  : "User";

                              return (
                                <div
                                  key={comment._id}
                                  style={{
                                    background: "#f8f9fa",
                                    borderRadius: 8,
                                    padding: 10,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      fontSize: 14,
                                      marginBottom: 4,
                                    }}
                                  >
                                    {userName}
                                  </div>

                                  <div
                                    style={{
                                      fontSize: 14,
                                      overflowWrap: "anywhere",
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {comment.text}
                                  </div>
                                </div>
                              );
                            })}

                            {(photo.comments ?? []).length === 0 && (
                              <p style={{ color: "#777", fontSize: 14, marginBottom: 0 }}>
                                No comments yet. Be the first to comment!
                              </p>
                            )}
                          </div>
                        </div>
                        {photo.uploadedBy === currentUserId && (
                          <button
                            type="button"
                            onClick={() => handleDelete(photo._id)}
                            disabled={deletingId === photo._id}
                            className="btn btn-danger"
                          >
                            {deletingId === photo._id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </Col>
                  ))}
                </Row>

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                      marginTop: 16,
                    }}
                  >
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={currentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) => page - 1)
                      }
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: totalPages },
                      (_, index) => index + 1
                    ).map((page) => (
                      <button
                        type="button"
                        key={page}
                        className={
                          currentPage === page
                            ? "btn btn-primary"
                            : "btn btn-outline-primary"
                        }
                        aria-current={
                          currentPage === page
                            ? "page"
                            : undefined
                        }
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      disabled={currentPage === totalPages}
                      onClick={() =>
                        setCurrentPage((page) => page + 1)
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Index;
