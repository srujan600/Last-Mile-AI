import React, { useState } from 'react';
import { MapPin, X, Navigation, Package, Clock, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AddDeliveryModal({ isOpen, onClose, onAddOrderSuccess }) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+919876543210');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState(17.4435);
  const [lng, setLng] = useState(78.3772);
  const [area, setArea] = useState('HITECH City, Hyderabad');
  const [parcelWeight, setParcelWeight] = useState(5.0);
  const [deliveryWindow, setDeliveryWindow] = useState(0);
  const [isCod, setIsCod] = useState(1);
  const [gatedCommunity, setGatedCommunity] = useState(0);
  
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleDetectPresentLocation = () => {
    setDetectingGps(true);
    setGpsStatus('Acquiring high-accuracy GPS coordinates...');
    setErrorMsg(null);

    if (!navigator.geolocation) {
      setGpsStatus(null);
      setErrorMsg('Geolocation is not supported by your browser.');
      setDetectingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detectedLat = Number(position.coords.latitude.toFixed(4));
        const detectedLng = Number(position.coords.longitude.toFixed(4));
        setLat(detectedLat);
        setLng(detectedLng);
        setArea(`Detected Locality (${detectedLat}, ${detectedLng})`);
        if (!address) {
          setAddress(`Current GPS Position (${detectedLat}, ${detectedLng}), Hyderabad`);
        }
        setGpsStatus(`📍 Present Location Detected: Lat ${detectedLat}, Lng ${detectedLng}`);
        setDetectingGps(false);
      },
      (err) => {
        console.warn('GPS detection fallback to Hyderabad hub coordinates:', err);
        setLat(17.4435);
        setLng(78.3772);
        setGpsStatus('📍 Location detected (Hyderabad Hub GPS Fallback: 17.4435, 78.3772)');
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !address) {
      setErrorMsg('Please enter customer name and delivery address.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        customer_name: customerName,
        customer_phone: customerPhone,
        address: address,
        lat: Number(lat),
        lng: Number(lng),
        area: area,
        parcel_weight_kg: Number(parcelWeight),
        delivery_window: Number(deliveryWindow),
        is_cod: Number(isCod),
        gated_community: Number(gatedCommunity),
        use_current_location: true
      };

      let res;
      try {
        res = await fetch('http://127.0.0.1:8000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch {
        res = await fetch('http://localhost:8000/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const newOrder = await res.json();
        if (onAddOrderSuccess) {
          onAddOrderSuccess(newOrder);
        }
        onClose();
      } else {
        const errData = await res.json();
        setErrorMsg(errData.detail || 'Failed to create new delivery.');
      }
    } catch (err) {
      setErrorMsg(`Error connecting to server: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 relative text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add New Location Delivery</h3>
              <p className="text-xs text-slate-400">Dispatch new package based on GPS coordinates or present location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* GPS Auto-Detect Banner Button */}
        <div className="bg-slate-950 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-indigo-300 flex items-center space-x-1.5">
              <Navigation className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Present GPS Geolocation</span>
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Detect current browser latitude &amp; longitude automatically</p>
          </div>
          <button
            type="button"
            onClick={handleDetectPresentLocation}
            disabled={detectingGps}
            className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all shrink-0 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
            <span>{detectingGps ? 'Locating...' : '📍 Find Present Location'}</span>
          </button>
        </div>

        {gpsStatus && (
          <p className="text-xs text-cyan-400 font-mono bg-cyan-950/40 border border-cyan-800/40 p-2.5 rounded-xl">
            {gpsStatus}
          </p>
        )}

        {errorMsg && (
          <p className="text-xs text-rose-400 font-mono bg-rose-950/40 border border-rose-800/40 p-2.5 rounded-xl">
            ⚠️ {errorMsg}
          </p>
        )}

        {/* Delivery Details Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram Sharma"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Customer Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Delivery Address *</label>
            <input
              type="text"
              required
              placeholder="e.g. Plot 42, Mindspace Road, Madhapur"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Hub Area</label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Parcel Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={parcelWeight}
                onChange={(e) => setParcelWeight(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Delivery Slot</label>
              <select
                value={deliveryWindow}
                onChange={(e) => setDeliveryWindow(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={0}>08:00 - 11:00 AM (Morning)</option>
                <option value={1}>11:00 AM - 02:00 PM (Midday)</option>
                <option value={2}>02:00 - 05:00 PM (Afternoon)</option>
                <option value={3}>05:00 - 08:00 PM (Evening)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method</label>
              <select
                value={isCod}
                onChange={(e) => setIsCod(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value={1}>Cash on Delivery (COD 💵)</option>
                <option value={0}>Prepaid (💳)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${submitting ? 'animate-spin' : ''}`} />
              <span>{submitting ? 'Dispatching...' : 'Dispatch Location Delivery'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
