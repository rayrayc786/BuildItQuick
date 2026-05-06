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
    discount: '', // This is the badge text
    imageUrl: '',
    isActive: true,
    link: '',
    categories: [] as string[],
    subCategories: [] as string[],
    // Rule-based fields
    offerType: 'BannerOnly',
    minAmount: 0,
    brandName: '',
    categoryName: '',
    productName: '',
    discountAmount: 0,
    freeDelivery: false,
    rewardItem: '',
    validityDays: 0
  });

  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allSubCategories, setAllSubCategories] = useState<any[]>([]);
  const [allBrands, setAllBrands] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: offersData }, { data: catsData }, { data: subCatsData }, { data: brandsData }] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/offers`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/categories`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/sub-categories`),
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/brands`)
      ]);
      setOffers(offersData);
      setAllCategories(catsData);
      setAllSubCategories(subCatsData);
      setAllBrands(brandsData);
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
        title: item.title || '',
        description: item.description || '',
        discount: item.discount || '',
        imageUrl: item.imageUrl || '',
        isActive: item.isActive,
        link: item.link || '',
        categories: item.categories || [],
        subCategories: item.subCategories || [],
        offerType: item.offerType || 'BannerOnly',
        minAmount: item.minAmount || 0,
        brandName: item.brandName || '',
        categoryName: item.categoryName || '',
        productName: item.productName || '',
        discountAmount: item.discountAmount || 0,
        freeDelivery: item.freeDelivery || false,
        rewardItem: item.rewardItem || '',
        validityDays: item.validityDays || 0
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
        subCategories: [],
        offerType: 'BannerOnly',
        minAmount: 0,
        brandName: '',
        categoryName: '',
        productName: '',
        discountAmount: 0,
        freeDelivery: false,
        rewardItem: '',
        validityDays: 0
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
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', fontWeight: 'bold' }}>{offer.title}</h3>
                  <div style={{ fontSize: '0.7rem', color: '#ff5722', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{offer.offerType}</div>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', minHeight: '40px' }}>{offer.description}</p>
                  
                  {offer.offerType !== 'BannerOnly' && (
                    <div style={{ marginTop: '10px', padding: '8px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                      {offer.brandName && <div><strong>Brand:</strong> {offer.brandName}</div>}
                      {offer.categoryName && <div><strong>Category:</strong> {offer.categoryName}</div>}
                      {offer.productName && <div><strong>Product:</strong> {offer.productName}</div>}
                      {offer.minAmount > 0 && <div><strong>Min Spend:</strong> ₹{offer.minAmount.toLocaleString()}</div>}
                      {offer.discountAmount > 0 && <div style={{ color: '#059669' }}><strong>Discount:</strong> ₹{offer.discountAmount.toLocaleString()}</div>}
                      {offer.freeDelivery && <div style={{ color: '#2563eb' }}><strong>Free Delivery:</strong> Yes</div>}
                      {offer.rewardItem && <div style={{ color: '#d97706' }}><strong>Reward:</strong> {offer.rewardItem}</div>}
                      {offer.validityDays > 0 && <div><strong>Validity:</strong> {offer.validityDays} Days</div>}
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
          <div className="modal-content animate-slide-up" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Offer' : 'New Offer'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
              </div>

              <div className="form-group">
                <label>Offer Type (Rule Engine)</label>
                <select 
                  value={formData.offerType} 
                  onChange={e => setFormData({...formData, offerType: e.target.value})}
                  style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                >
                  <option value="BannerOnly">Banner Only (Promotional)</option>
                  <option value="standard">Discount on Minimum Order Amount</option>
                  <option value="category">Category Specific Discount</option>
                  <option value="brand">Brand Specific Discount</option>
                  <option value="product">Product Reward (Freebie)</option>
                  <option value="accumulated">Accumulated Loyalty Reward</option>
                </select>
              </div>

              {formData.offerType !== 'BannerOnly' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '15px', background: '#f0f9ff', borderRadius: '12px', marginBottom: '15px' }}>
                  {formData.offerType === 'brand' && (
                    <div className="form-group">
                      <label>Select Brand</label>
                      <select 
                        value={formData.brandName} 
                        onChange={e => setFormData({...formData, brandName: e.target.value})}
                        style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      >
                        <option value="">Select Brand</option>
                        {allBrands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                      </select>
                    </div>
                  )}

                  {formData.offerType === 'category' && (
                    <div className="form-group">
                      <label>Select Category</label>
                      <select 
                        value={formData.categoryName} 
                        onChange={e => setFormData({...formData, categoryName: e.target.value})}
                        style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                      >
                        <option value="">Select Category</option>
                        {allCategories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  {formData.offerType === 'product' && (
                    <div className="form-group">
                      <label>Target Product Name (Exact or Keyword)</label>
                      <input 
                        type="text" 
                        value={formData.productName} 
                        onChange={e => setFormData({...formData, productName: e.target.value})}
                        placeholder="e.g. 5 ltr Paint Bucket"
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Min Amount Required (₹)</label>
                    <input 
                      type="number" 
                      value={formData.minAmount} 
                      onChange={e => setFormData({...formData, minAmount: Number(e.target.value)})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Discount Amount (₹)</label>
                    <input 
                      type="number" 
                      value={formData.discountAmount} 
                      onChange={e => setFormData({...formData, discountAmount: Number(e.target.value)})}
                    />
                  </div>

                  <div className="form-group">
                    <label>Reward Item Name (Freebie)</label>
                    <input 
                      type="text" 
                      value={formData.rewardItem} 
                      onChange={e => setFormData({...formData, rewardItem: e.target.value})}
                      placeholder="e.g. Paint starter kit"
                    />
                  </div>

                  {formData.offerType === 'accumulated' && (
                    <div className="form-group">
                      <label>Validity Window (Days)</label>
                      <input 
                        type="number" 
                        value={formData.validityDays} 
                        onChange={e => setFormData({...formData, validityDays: Number(e.target.value)})}
                        placeholder="e.g. 45"
                      />
                    </div>
                  )}

                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="checkbox" 
                      id="free-delivery"
                      checked={formData.freeDelivery} 
                      onChange={e => setFormData({...formData, freeDelivery: e.target.checked})} 
                    />
                    <label htmlFor="free-delivery" style={{ marginBottom: 0 }}>Include Free Delivery</label>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Description (Short summary of the offer)</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Details about this offer..."
                />
              </div>

              <div className="form-group">
                <label>Target Link (Auto-generated or Custom)</label>
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
