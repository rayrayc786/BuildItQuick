# Mobile Implementation Guide: Replicating Web Features in React Native

This guide outlines how to implement the recent changes (Dynamic Delivery Fees, Waiver Rules, and Bill Summary) from the MatAll Web App into the React Native Mobile App.

---

## 1. Core Logic: Cart Calculation
The React Native app should **not** calculate taxes or delivery fees locally. Instead, it must rely on the backend calculation engine to ensure 100% consistency with the web app.

### API Integration
Use the `/api/cart/calculate` endpoint for the Cart and Checkout screens.

**Request Payload:**
```json
{
  "items": [
    {
      "productId": "65f...",
      "quantity": 2,
      "selectedVariant": "5 ltr"
    }
  ]
}
```

**Key Response Fields to Display:**
- `subTotal`: Item Total (Inclusive of GST).
- `totalBaseAmount`: Item Total (Exclusive of GST).
- `totalTaxAmount`: Total GST.
- `deliveryCharge`: Current delivery fee (0 if free).
- `deliveryChargeBreakup`: Object with `{ base, gst }` for transparency.
- `platformFee`: Fixed platform/handling charge.
- `grandTotal`: The final payable amount.
- `vehicleClass`: Mode of transport (Bike, Three Wheeler, Truck).
- `rewardItems`: List of free gifts unlocked.
- `appliedOffers`: List of applied promo titles.

---

## 2. UI Components to Replicate

### A. Bill Summary (Cart & Checkout)
The mobile UI should exactly match the web's breakdown:
1. **Item Total (Excl. GST)**: Map to `totalBaseAmount`.
2. **GST Amount**: Map to `totalTaxAmount`.
3. **Delivery Charge**: 
   - If > 0: Show `₹XX.XX` and a sub-label with the breakup: `(₹Base + ₹GST)`.
   - If 0: Show **FREE** in green.
4. **Handling Charge**: Map to `platformFee`.
5. **Grand Total**: Map to `grandTotal`.
6. **Savings Badge**: If `totalSavings > 0`, show a badge: "You saved ₹XX.XX".

### B. Tracking Screen (Order Details)
Replicate the "Shipment Details" and "Bill Summary" from the web:
- **Timeline**: Map the `order.status` to the multi-step timeline (Accepted -> Packed -> Rider at Hub -> On the way -> Delivered).
- **Official Invoice**: Display `hisaabKitaabInvoiceNumber` once synced. If it contains "Error" or "Not Found", show it in red; otherwise, show it in green.
- **Product Reviews**: In the "Delivered" state, show the "Write a Review" button with star ratings for each item.

---

## 3. Delivery Waiver Rules (Backend Controlled)
The backend `orderService` now automatically applies these rules. Your mobile app will see the result in `deliveryCharge: 0`. 

**Waiver Scenarios implemented:**
- **First Order**: Free delivery for 'Light' items on the first order (min ₹500).
- **Light Only**: Free delivery for 'Light' items over ₹1000.
- **Medium/Light**: Free delivery for 'Medium' or 'Light' items over ₹5000.
- **Small Order Cap**: Capped at ₹29 for very small 'Light' orders (< ₹150).

---

## 4. Technical Best Practices

### ID Comparison
Always use `String()` conversion when comparing MongoDB `_id` values or derived IDs (like `variantId`) in the mobile frontend to prevent object/string mismatch issues.

### Deep Linking
The production domain `https://matall.app/` is configured for deep linking.
- **Android**: Ensure `assetlinks.json` is verified.
- **iOS**: Ensure `apple-app-site-association` is served correctly.
- **Navigation**: In `App.js`, configure `linking` to handle `/orders/:id` and `/products/:id`.

### Real-time Updates
Use `socket.io-client` to listen for:
- `order-status-update`: To update the tracking timeline live.
- `invoice-number-updated`: To show the generated invoice number without a page refresh.

---

## 5. Summary Checklist
- [ ] Call `/api/cart/calculate` on every cart change.
- [ ] Update Bill Summary UI to show Base vs GST split.
- [ ] Implement vehicle mode indicator (Bike/Truck icon) in Cart.
- [ ] Add "Free Rewards" list in Cart summary.
- [ ] Implement star rating system in Tracking for delivered orders.
- [ ] Ensure "Official Invoice" number is visible in Order Details.
