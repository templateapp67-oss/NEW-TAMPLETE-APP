import React, { useState } from 'react';
import { SalonData, SalonAddress, SalonOpeningHours, DaySchedule } from '../types';
import PreviewPane from '../components/PreviewPane';
import { 
  MapPin, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  Navigation, 
  Search, 
  Copy, 
  Check, 
  Building2, 
  CheckCircle2, 
  Crosshair 
} from 'lucide-react';

interface Props {
  data: SalonData;
  setData: React.Dispatch<React.SetStateAction<SalonData>>;
  onNext: () => void;
  onPrev: () => void;
  onSave?: (msg?: string) => void;
}

const DEFAULT_ADDRESS: SalonAddress = {
  fullAddress: 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050',
  city: 'Mumbai',
  area: 'Bandra West',
  state: 'Maharashtra',
  pinCode: '400050'
};

const DEFAULT_HOURS: SalonOpeningHours = {
  monday: { open: true, startTime: '10:00', endTime: '20:00' },
  tuesday: { open: true, startTime: '10:00', endTime: '20:00' },
  wednesday: { open: true, startTime: '10:00', endTime: '20:00' },
  thursday: { open: true, startTime: '10:00', endTime: '20:00' },
  friday: { open: true, startTime: '10:00', endTime: '20:00' },
  saturday: { open: true, startTime: '10:00', endTime: '20:00' },
  sunday: { open: false, startTime: '10:00', endTime: '20:00' }
};

export default function StepLocation({ data, setData, onNext, onPrev, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const address = data.address || DEFAULT_ADDRESS;
  const hours = data.openingHours || DEFAULT_HOURS;

  const updateAddress = (fields: Partial<SalonAddress>) => {
    const updated = { ...address, ...fields };
    setData(prev => ({ ...prev, address: updated }));
    if (onSave) onSave('Address updated');
  };

  const updateDayHours = (day: keyof SalonOpeningHours, fields: Partial<DaySchedule>) => {
    const updated = {
      ...hours,
      [day]: { ...hours[day], ...fields }
    };
    setData(prev => ({ ...prev, openingHours: updated }));
    if (onSave) onSave('Opening hours updated');
  };

  const copyMondayToAll = () => {
    const mon = hours.monday;
    const updated: SalonOpeningHours = {
      monday: { ...mon },
      tuesday: { ...mon },
      wednesday: { ...mon },
      thursday: { ...mon },
      friday: { ...mon },
      saturday: { ...mon },
      sunday: { ...hours.sunday } // keep sunday state or update
    };
    setData(prev => ({ ...prev, openingHours: updated }));
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
    if (onSave) onSave('Copied Monday schedule to all days');
  };

  const markSundayClosed = () => {
    updateDayHours('sunday', { open: false });
  };

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsLocating(false);
          updateAddress({
            fullAddress: 'Shop 14, Linking Road, Bandra West, Mumbai, Maharashtra 400050',
            city: 'Mumbai',
            area: 'Bandra West',
            state: 'Maharashtra',
            pinCode: '400050'
          });
        },
        () => {
          setIsLocating(false);
          updateAddress(DEFAULT_ADDRESS);
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const daysList: { key: keyof SalonOpeningHours; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#f9f9f9]">
      {/* Mobile view tab switcher */}
      <div className="md:hidden flex border-b border-gray-200 bg-white sticky top-0 z-20">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors ${
            activeTab === 'edit'
              ? 'border-[#ac0053] text-[#ac0053] bg-[#ffd9e1]/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Edit Location & Hours
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-3 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'preview'
              ? 'border-[#ac0053] text-[#ac0053] bg-[#ffd9e1]/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" /> Live Preview
        </button>
      </div>

      {/* LEFT COLUMN: Form Area (55%) */}
      <div className={`w-full md:w-[55%] h-full overflow-y-auto px-4 md:px-10 py-8 flex flex-col space-y-8 ${
        activeTab === 'preview' ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ac0053]">
            <MapPin className="w-4 h-4" /> STEP 08 • LOCATION & OPENING HOURS
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1c1c]">Where is your salon?</h1>
          <p className="text-sm text-[#5f5e5e]">Add your address and opening hours. Customers will see this on your website.</p>
        </div>

        {/* Address Section */}
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#1a1c1c] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#ac0053]" /> Business Address
            </h2>
            <span className="text-xs font-medium text-gray-400">Step 8 of 15</span>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#1a1c1c]">Full Address</label>
            <textarea
              value={address.fullAddress}
              onChange={e => updateAddress({ fullAddress: e.target.value })}
              placeholder="e.g. Shop 8, Vaishali Nagar, Jaipur, Rajasthan 302021"
              rows={2}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-[#1a1c1c] focus:border-[#ac0053] focus:ring-2 focus:ring-[#ffd9e1] focus:bg-white outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#ac0053] bg-[#ffd9e1]/40 hover:bg-[#ffd9e1]/70 font-semibold text-xs transition-colors border border-[#ffd9e1]"
            >
              <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use Current Location'}</span>
            </button>
            <button
              onClick={() => updateAddress(DEFAULT_ADDRESS)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <span>Search Address</span>
            </button>
          </div>

          {/* Map Embedded Interactive Card */}
          <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200 group shadow-inner bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=800&auto=format&fit=crop"
              alt="Salon Location Map"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Animated Location Pin */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-12 h-12 bg-[#ac0053]/20 rounded-full flex items-center justify-center animate-pulse">
                <MapPin className="w-8 h-8 text-[#ac0053] fill-[#ac0053]" />
              </div>
            </div>

            {/* Address Badge Overlay */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-lg shadow-sm text-xs font-semibold text-gray-800 flex items-center gap-1.5 border border-gray-200/60">
              <MapPin className="w-3.5 h-3.5 text-[#ac0053]" />
              <span className="truncate max-w-[200px]">{address.city || 'Mumbai'}, {address.state || 'Maharashtra'}</span>
            </div>

            {/* Hover Action Button */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="bg-[#ac0053] text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-md hover:bg-[#ba005b] transition-colors flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5" /> Set Pin Location
              </button>
            </div>
          </div>

          {/* Granular Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Shop / Flat No.</label>
              <input
                type="text"
                value={address.shopNumber || ''}
                onChange={e => {
                  const shopNumber = e.target.value;
                  const fullAddress = `${shopNumber}, ${address.area}, ${address.city}, ${address.state} ${address.pinCode}`.replace(/^, /, '');
                  updateAddress({ shopNumber, fullAddress });
                }}
                placeholder="e.g. Shop 14, Ground Floor"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Area / Locality</label>
              <input
                type="text"
                value={address.area}
                onChange={e => {
                  const area = e.target.value;
                  const shopStr = address.shopNumber ? `${address.shopNumber}, ` : '';
                  const fullAddress = `${shopStr}${area}, ${address.city}, ${address.state} ${address.pinCode}`.replace(/^, /, '');
                  updateAddress({ area, fullAddress });
                }}
                placeholder="e.g. Linking Road, Bandra West"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">City</label>
              <input
                type="text"
                value={address.city}
                onChange={e => {
                  const city = e.target.value;
                  const shopStr = address.shopNumber ? `${address.shopNumber}, ` : '';
                  const fullAddress = `${shopStr}${address.area}, ${city}, ${address.state} ${address.pinCode}`.replace(/^, /, '');
                  updateAddress({ city, fullAddress });
                }}
                placeholder="e.g. Mumbai, Bengaluru, Delhi"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">State</label>
              <select
                value={address.state}
                onChange={e => {
                  const state = e.target.value;
                  const shopStr = address.shopNumber ? `${address.shopNumber}, ` : '';
                  const fullAddress = `${shopStr}${address.area}, ${address.city}, ${state} ${address.pinCode}`.replace(/^, /, '');
                  updateAddress({ state, fullAddress });
                }}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              >
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Gujarat">Gujarat</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Telangana">Telangana</option>
                <option value="Kerala">Kerala</option>
                <option value="Haryana">Haryana</option>
                <option value="Punjab">Punjab</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Bihar">Bihar</option>
                <option value="Odisha">Odisha</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-[#1a1c1c]">PIN Code (6 digits)</label>
                {address.pinCode && (
                  <span className={`text-[10px] font-bold ${/^\d{6}$/.test(address.pinCode) ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {/^\d{6}$/.test(address.pinCode) ? '✓ Valid PIN' : 'Enter 6 digits'}
                  </span>
                )}
              </div>
              <input
                type="text"
                maxLength={6}
                value={address.pinCode}
                onChange={e => {
                  const pinCode = e.target.value.replace(/\D/g, '').slice(0, 6);
                  const shopStr = address.shopNumber ? `${address.shopNumber}, ` : '';
                  const fullAddress = `${shopStr}${address.area}, ${address.city}, ${address.state} ${pinCode}`.replace(/^, /, '');
                  updateAddress({ pinCode, fullAddress });
                }}
                placeholder="400050"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none tracking-widest font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Landmark (Optional)</label>
              <input
                type="text"
                value={address.landmark || ''}
                onChange={e => updateAddress({ landmark: e.target.value })}
                placeholder="e.g. Opposite Metro Station"
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2 text-xs text-[#1a1c1c] focus:border-[#ac0053] focus:bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Opening Hours Section */}
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs mb-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
            <h2 className="text-lg font-bold text-[#1a1c1c] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#ac0053]" /> Opening Hours
            </h2>

            <div className="flex items-center gap-3">
              <button
                onClick={copyMondayToAll}
                className="text-xs font-semibold text-[#ac0053] hover:underline flex items-center gap-1"
              >
                {copiedSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSuccess ? 'Schedule Copied!' : 'Copy Monday to all'}</span>
              </button>

              <button
                onClick={markSundayClosed}
                className="text-xs font-semibold text-[#ac0053] hover:underline"
              >
                Mark Sunday closed
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {daysList.map(({ key, label }) => {
              const dayObj = hours[key] || { open: true, startTime: '10:00', endTime: '20:00' };

              return (
                <div
                  key={key}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl transition-colors gap-3 ${
                    dayObj.open ? 'bg-gray-50/70 hover:bg-gray-100/70' : 'bg-gray-100/50 opacity-70'
                  }`}
                >
                  <div className="flex items-center gap-3 w-36">
                    {/* Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => updateDayHours(key, { open: !dayObj.open })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        dayObj.open ? 'bg-[#ac0053]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dayObj.open ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs font-bold text-[#1a1c1c]">{label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold w-12 ${dayObj.open ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {dayObj.open ? 'Open' : 'Closed'}
                    </span>

                    {dayObj.open ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={dayObj.startTime}
                          onChange={e => updateDayHours(key, { startTime: e.target.value })}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-[#1a1c1c] focus:border-[#ac0053] outline-none"
                        />
                        <span className="text-gray-400 text-xs">-</span>
                        <input
                          type="time"
                          value={dayObj.endTime}
                          onChange={e => updateDayHours(key, { endTime: e.target.value })}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs text-[#1a1c1c] focus:border-[#ac0053] outline-none"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Day off</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Preview Pane (45%) */}
      <div className={`w-full md:w-[45%] h-full bg-gray-100 border-l border-gray-200 ${
        activeTab === 'edit' ? 'hidden md:block' : 'block'
      }`}>
        <PreviewPane data={data} step={7} />
      </div>

      {/* Sticky Bottom Navigation Footer */}
      <footer className="fixed bottom-0 left-0 w-full flex justify-between items-center px-6 py-4 bg-white z-50 border-t border-gray-200 shadow-md">
        <button
          onClick={onPrev}
          className="border border-gray-300 text-gray-700 rounded-xl px-6 py-2.5 font-semibold text-xs hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="hidden sm:block text-xs font-medium text-gray-400">
          Step 8 of 15 • Location & Opening Hours
        </div>

        <button
          onClick={onNext}
          className="bg-[#ac0053] text-white rounded-xl px-6 py-2.5 font-semibold text-xs hover:bg-[#ba005b] transition-colors flex items-center gap-2 shadow-xs"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
}
