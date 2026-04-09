import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import './admin-dashboard.css';

const ReviewManager: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert('Failed to update review status');
    }
  };

  const deleteReview = async (id: string) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/reviews/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReviews();
    } catch (err) {
      console.error(err);
      alert('Failed to delete review');
    }
  };

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div className="admin-content-card">
      <div className="admin-card-header">
        <h2>Customer Reviews</h2>
      </div>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Review Details</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map(r => (
              <tr key={r._id}>
                <td>{r.productId?.brand || ''} {r.productId?.name || r.productId?.productName}</td>
                <td>
                  <div>{r.userId?.name}</div>
                  <div className="txt-sec">{r.userId?.email}</div>
                </td>
                <td>
                  <div style={{ display: 'flex' }}>
                   {[1,2,3,4,5].map(s => (
                     <Star key={s} size={14} fill={s <= r.rating ? "#facc15" : "transparent"} color={s <= r.rating ? "#facc15" : "#cbd5e1"} />
                   ))}
                  </div>
                </td>
                <td>
                  <p style={{ margin: 0, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.comment}>
                    {r.comment}
                  </p>
                </td>
                <td>
                  <span className={`status-badge ${(r.status || 'pending').toLowerCase()}`}>{r.status}</span>
                </td>
                <td>
                  <div className="action-cell">
                    {r.status !== 'approved' && (
                      <button className="icon-action-btn success" onClick={() => updateStatus(r._id, 'approved')} title="Approve">
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {r.status !== 'rejected' && (
                      <button className="icon-action-btn warning" onClick={() => updateStatus(r._id, 'rejected')} title="Reject">
                        <XCircle size={16} />
                      </button>
                    )}
                    <button className="icon-action-btn danger" onClick={() => deleteReview(r._id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>No reviews found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReviewManager;
