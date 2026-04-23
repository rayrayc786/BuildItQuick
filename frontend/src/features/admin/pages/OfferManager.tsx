import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit3, Trash2, X, Image } from 'lucide-react';
import { getFullImageUrl } from '../../../utils/imageUrl';

const OfferManager: React.FC = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discount: '',
    imageUrl: '',
    isActive: true,
    link: '',
    categories: [] as string[],
    subCategories: [] as string[]
  });

  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: offersData }, { data: catsData }, { data: subCatsData }] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offers`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories`)
      ]);
      setOffers(offersData);
      setAllCategories(catsData);
      setAllSubCategories(subCatsData);
    } catch (err) {
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    
    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/products/upload-image`, uploadData);
      setFormData({ ...formData, imageUrl: data.imageUrl });
    } catch (err) {
      alert('Upload failed');
    }
  };

  useEffect(() => {
    if (formData.categories.length > 0 || formData.subCategories.length > 0) {
      const catParts = formData.categories.map(id => {
        const cat = allCategories.find(c => c._id === id);
        return cat ? cat.name : id;
      }).join(',');
      
      const subParts = formData.subCategories.map(id => {
        const sub = allSubCategories.find(s => s._id === id);
        return sub ? sub.name : id;
      }).join(',');

      let newLink = '/products?';
      if (catParts) newLink += `category=${encodeURIComponent(catParts)}`;
      if (subParts) newLink += `${catParts ? '&' : ''}subCategory=${encodeURIComponent(subParts)}`;
      
      setFormData(prev => ({ ...prev, link: newLink }));
    }
  }, [formData.categories, formData.subCategories]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offers/${editingItem._id}`, formData);
      } else {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offers`, formData);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Save failed');
    }
  };

  const openForm = (item: any = null) => {
    setEditingItem(item);
    if (item) {
      setFormData({
        title: item.title,
        description: item.description || '',
        discount: item.discount || '',
        imageUrl: item.imageUrl || '',
        isActive: item.isActive,
        link: item.link || '',
        categories: item.categories || [],
        subCategories: item.subCategories || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        discount: '',
        imageUrl: '',
        isActive: true,
        link: '',
        categories: [],
        subCategories: []
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offers/${id}`);
      fetchData();
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="category-manager-container animate-fade-in">
      <header className="manager-header">
        <div className="header-text">
          <h1>Offer Management</h1>
          <p>Create and edit promotional banners for the home page</p>
        </div>
        <button className="add-btn" onClick={() => openForm()}>
          <Plus size={20} /> Add Offer
        </button>
      </header>

      <div className="manager-content">
        {loading ? (
          <div className="loading-state">Loading offers...</div>
        ) : (
          <div className="offers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {offers.map((offer) => (
              <div key={offer._id} className="offer-admin-card" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div className="card-img-box" style={{ height: '160px', background: '#f1f5f9', position: 'relative' }}>
                  {offer.imageUrl ? (
                    <img src={getFullImageUrl(offer.imageUrl)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Image size={32} color="#94a3b8" /></div>
                  )}
                  {offer.discount && <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#FFEA00', color: 'black', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>{offer.discount}</div>}
                </div>
                <div className="card-body" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>{offer.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', minHeight: '40px' }}>{offer.description}</p>
                  
                  {offer.categories?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                      {offer.categories.map((catId: string) => (
                        <span key={catId} style={{ fontSize: '10px', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          {allCategories.find(c => c._id === catId)?.name || 'Cat'}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: offer.isActive ? '#10b981' : '#ef4444' }}></div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{offer.isActive ? 'Active' : 'Hidden'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="icon-btn" onClick={() => openForm(offer)} style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Edit3 size={16} /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(offer._id)} style={{ border: 'none', background: '#fee2e2', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Offer' : 'New Offer'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Offer Title / Headline</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Plyboard + Modular Hardware"
                  required
                />
              </div>
              <div className="form-group">
                <label>Discount Badge (Text)</label>
                <input 
                  type="text" 
                  value={formData.discount} 
                  onChange={e => setFormData({...formData, discount: e.target.value})} 
                  placeholder="e.g. Flat 20% OFF or Combo Deal"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Details about this offer..."
                />
              </div>
              <div className="form-group">
                <label>Dynamic Filtering (Club Categories/Subcategories)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', color: '#64748b' }}>SELECT CATEGORIES</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {allCategories.map(cat => (
                        <label key={cat._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '4px 10px', border: formData.categories.includes(cat._id) ? '1px solid #FFEA00' : '1px solid #eee', background: formData.categories.includes(cat._id) ? '#ffea0010' : 'white', borderRadius: '20px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.categories.includes(cat._id)}
                            onChange={(e) => {
                              const newCats = e.target.checked 
                                ? [...formData.categories, cat._id]
                                : formData.categories.filter(id => id !== cat._id);
                              setFormData({ ...formData, categories: newCats });
                            }}
                            style={{ display: 'none' }}
                          />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px', color: '#64748b' }}>SELECT SUBCATEGORIES (Optional)</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '120px', overflowY: 'auto', padding: '4px' }}>
                      {allSubCategories
                        .filter(sc => formData.categories.length === 0 || formData.categories.includes(sc.categoryId?._id || sc.categoryId))
                        .map(sc => (
                        <label key={sc._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '4px 10px', border: formData.subCategories.includes(sc._id) ? '1px solid #FFEA00' : '1px solid #eee', background: formData.subCategories.includes(sc._id) ? '#ffea0010' : 'white', borderRadius: '20px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={formData.subCategories.includes(sc._id)}
                            onChange={(e) => {
                              const newSubs = e.target.checked 
                                ? [...formData.subCategories, sc._id]
                                : formData.subCategories.filter(id => id !== sc._id);
                              setFormData({ ...formData, subCategories: newSubs });
                            }}
                            style={{ display: 'none' }}
                          />
                          {sc.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Target Link (Auto-generated from combo)</label>
                <input 
                  type="text" 
                  value={formData.link} 
                  onChange={e => setFormData({...formData, link: e.target.value})} 
                  placeholder="e.g. /products?brand=Jaquar or /category/electric"
                />
              </div>

              <div className="form-group">
                <label>Offer Background Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '120px', height: '80px', borderRadius: '8px', background: '#f1f5f9', backgroundImage: formData.imageUrl ? `url(${getFullImageUrl(formData.imageUrl)})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!formData.imageUrl && <Image size={24} color="#94a3b8" />}
                  </div>
                  <div>
                    <input type="file" id="offer-img" hidden accept="image/*" onChange={handleImageUpload} />
                    <label htmlFor="offer-img" className="secondary-btn" style={{ fontSize: '0.8rem', cursor: 'pointer', padding: '6px 12px', background: '#000', color: '#fff', borderRadius: '6px' }}>Upload Image</label>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  id="offer-active"
                  checked={formData.isActive} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                />
                <label htmlFor="offer-active" style={{ marginBottom: 0 }}>Is Active</label>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid #eee', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="primary-btn" style={{ background: '#FFEA00', color: 'black', fontWeight: 'bold', border: 'none', padding: '8px 24px', borderRadius: '8px' }}>{editingItem ? 'Update Offer' : 'Create Offer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal-content { background: white; width: 100%; border-radius: 20px; padding: 2rem; position: relative; }
        .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 1.25rem; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: #475569; }
        .form-group input[type="text"], .form-group textarea { padding: 10px; border: 1px solid #e2e8f0; borderRadius: 8px; }
        .form-group textarea { min-height: 80px; resize: vertical; }
      `}</style>
    </div>
  );
};

export default OfferManager;
