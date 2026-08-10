import { Sparkles, Mic, ArrowLeft, ArrowRight, Plus, Check, Edit2, Copy, Trash2, GripVertical, Info, Volume2, X } from 'lucide-react';
import { SalonData, Service, Package } from '../types';
import PreviewPane from '../components/PreviewPane';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent } from 'react';

interface Props {
  data: SalonData;
  setData: (d: SalonData) => void;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
}

export default function StepServices({ data, setData, onNext, onPrev, onSave }: Props) {
  const suggestedList = [
    { name: 'Haircut', category: 'Haircut', price: 300, duration: 30, description: 'Classic and modern haircut tailored to your style.' },
    { name: 'Hair Styling', category: 'Styling', price: 250, duration: 30, description: 'Blowout and professional heat styling.' },
    { name: 'Hair Color', category: 'Color', price: 1200, duration: 90, description: 'Full gray coverage or single process vibrant color treatment.' },
    { name: 'Highlights', category: 'Color', price: 1800, duration: 120, description: 'Dimensional foil highlights for natural brightness.' },
    { name: 'Keratin', category: 'Treatment', price: 3500, duration: 120, description: 'Smoothing treatment for frizz-free, silky hair.' },
    { name: 'Hair Spa', category: 'Treatment', price: 850, duration: 45, description: 'Deep conditioning treatment to restore moisture and shine.' },
    { name: 'Beard Grooming', category: 'Barbering', price: 200, duration: 25, description: 'Precision beard trim, shaping, and hot towel finish.' },
  ];

  const [selectedSuggested, setSelectedSuggested] = useState<string[]>(['Hair Styling']);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // New Service Form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(50);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceCategory, setNewServiceCategory] = useState('Haircut');
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // New Package Form state
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackagePrice, setNewPackagePrice] = useState(95);
  const [newPackageDuration, setNewPackageDuration] = useState(60);
  const [newPackageDesc, setNewPackageDesc] = useState('');

  const toggleSuggested = (name: string) => {
    setSelectedSuggested(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const selectAllSuggested = () => {
    if (selectedSuggested.length === suggestedList.length) {
      setSelectedSuggested([]);
    } else {
      setSelectedSuggested(suggestedList.map(s => s.name));
    }
  };

  const handleAddSelected = () => {
    if (selectedSuggested.length === 0) return;
    const newServices: Service[] = selectedSuggested.map(sName => {
      const found = suggestedList.find(s => s.name === sName);
      return {
        id: 's-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name: found ? found.name : sName,
        category: found ? found.category : 'General',
        description: found ? found.description : 'Professional service provided by experienced stylists.',
        price: found ? found.price : 50,
        duration: found ? found.duration : 30
      };
    });

    setData({
      ...data,
      services: [...data.services, ...newServices]
    });
    setSelectedSuggested([]);
    if (onSave) onSave();
  };

  const handleAISuggest = () => {
    const aiAdded: Service[] = [
      {
        id: 'ai-1',
        name: 'Organic Scalp Detox',
        category: 'Treatment',
        description: 'Exfoliating botanical treatment for ultimate scalp health.',
        price: 850,
        duration: 45,
        featured: true
      },
      {
        id: 'ai-2',
        name: 'Express Gloss & Shine',
        category: 'Color',
        description: 'Instant demi-permanent glaze for high-gloss tone.',
        price: 650,
        duration: 30
      }
    ];
    setData({
      ...data,
      services: [...data.services, ...aiAdded]
    });
    if (onSave) onSave();
  };

  const handleSpeechInput = () => {
    setIsSpeaking(true);
    setTimeout(() => {
      setIsSpeaking(false);
      const voiceService: Service = {
        id: 'v-' + Date.now(),
        name: 'Gentlemen\'s Royal Cut',
        category: 'Barbering',
        description: 'Custom haircut with scalp massage and hot towel treatment.',
        price: 400,
        duration: 40
      };
      setData({
        ...data,
        services: [...data.services, voiceService]
      });
      if (onSave) onSave();
    }, 1500);
  };

  const handleCreateService = (e: FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const created: Service = {
      id: 'custom-' + Date.now(),
      name: newServiceName,
      category: newServiceCategory || 'General',
      description: newServiceDesc || 'Custom salon service.',
      price: Number(newServicePrice) || 0,
      duration: Number(newServiceDuration) || 30
    };
    setData({
      ...data,
      services: [...data.services, created]
    });
    setNewServiceName('');
    setNewServiceDesc('');
    setIsAddingService(false);
    if (onSave) onSave();
  };

  const handleCreatePackage = (e: FormEvent) => {
    e.preventDefault();
    if (!newPackageName.trim()) return;
    const created: Package = {
      id: 'pkg-' + Date.now(),
      name: newPackageName,
      description: newPackageDesc || 'Combo package offering maximum savings.',
      price: Number(newPackagePrice) || 0,
      duration: Number(newPackageDuration) || 60
    };
    setData({
      ...data,
      packages: [...data.packages, created]
    });
    setNewPackageName('');
    setNewPackageDesc('');
    setIsAddingPackage(false);
    if (onSave) onSave();
  };

  const handleDeleteService = (id: string) => {
    setData({
      ...data,
      services: data.services.filter(s => s.id !== id)
    });
    if (onSave) onSave();
  };

  const handleDuplicateService = (s: Service) => {
    const dup: Service = {
      ...s,
      id: 'dup-' + Date.now(),
      name: `${s.name} (Copy)`
    };
    setData({
      ...data,
      services: [...data.services, dup]
    });
    if (onSave) onSave();
  };

  const handleDeletePackage = (id: string) => {
    setData({
      ...data,
      packages: data.packages.filter(p => p.id !== id)
    });
    if (onSave) onSave();
  };

  return (
    <div className="flex-1 flex w-full h-full bg-[#f9f9f9]">
      <div className="w-full md:w-[55%] h-full flex flex-col relative bg-[#f9f9f9] border-r border-[#eeeeee]">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto pb-32 space-y-8">
            <div>
              <span className="text-xs font-semibold tracking-widest text-[#5f5e5e] uppercase">SERVICES</span>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1a1c1c] mt-1 mb-2">What services do you offer?</h1>
              <p className="text-[#5f5e5e] text-base">Choose your services, add prices and your website will update instantly.</p>
            </div>

            {/* Suggested Services */}
            <div className="bg-white rounded-lg border border-[#eeeeee] p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-[#1a1c1c] uppercase tracking-wider">SUGGESTED SERVICES</h3>
                <button 
                  onClick={selectAllSuggested}
                  className="text-xs font-semibold text-[#ac0053] hover:underline"
                >
                  {selectedSuggested.length === suggestedList.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedList.map(s => {
                  const isSelected = selectedSuggested.includes(s.name);
                  return (
                    <button
                      key={s.name}
                      onClick={() => toggleSuggested(s.name)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? 'border-[#ac0053] bg-[#ffd9e1] text-[#3f001a]' 
                          : 'border-[#eeeeee] bg-[#f9f9f9] text-[#1a1c1c] hover:border-[#ac0053] hover:text-[#ac0053]'
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4 text-[#ac0053]" /> : <Plus className="w-4 h-4 text-[#5f5e5e]" />}
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <div className="pt-2">
                <button 
                  onClick={handleAddSelected}
                  disabled={selectedSuggested.length === 0}
                  className="bg-[#ac0053] text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#ba005b] transition-colors disabled:opacity-40"
                >
                  Add Selected ({selectedSuggested.length})
                </button>
              </div>
            </div>

            {/* Fast Add */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleSpeechInput}
                disabled={isSpeaking}
                className="flex-1 bg-white border border-[#eeeeee] rounded-lg p-4 flex items-center justify-center gap-2 hover:border-[#ac0053] transition-colors group shadow-sm"
              >
                {isSpeaking ? (
                  <Volume2 className="w-5 h-5 text-[#ac0053] animate-pulse" />
                ) : (
                  <Mic className="w-5 h-5 text-[#5f5e5e] group-hover:text-[#ac0053] transition-colors" />
                )}
                <span className="text-sm font-semibold text-[#1a1c1c] group-hover:text-[#ac0053] transition-colors">
                  {isSpeaking ? 'Listening...' : 'Speak your services'}
                </span>
              </button>
              
              <button 
                onClick={handleAISuggest}
                className="flex-1 bg-white border border-[#eeeeee] rounded-lg p-4 flex items-center justify-center gap-2 hover:border-[#ac0053] transition-colors group shadow-sm"
              >
                <Sparkles className="w-5 h-5 text-[#5f5e5e] group-hover:text-[#ac0053] transition-colors" />
                <span className="text-sm font-semibold text-[#1a1c1c] group-hover:text-[#ac0053] transition-colors">
                  Suggest with AI
                </span>
              </button>
            </div>

            <hr className="border-[#eeeeee]" />

            {/* My Services List */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold tracking-wider text-[#5f5e5e] uppercase">MY SERVICES ({data.services.length})</h3>
              
              <AnimatePresence>
                {data.services.map((s) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={s.id} 
                    className="bg-white border border-[#eeeeee] rounded-lg p-5 shadow-sm flex flex-col gap-4 group hover:border-[#ac0053]/40 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="text-[#5f5e5e] cursor-grab pt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-[#1a1c1c]">{s.name}</h4>
                            {s.featured && (
                              <span className="bg-[#ffd9e1] text-[#3f001a] font-medium text-[10px] px-2 py-0.5 rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#5f5e5e]">
                            <span className="font-semibold text-[#1a1c1c]">₹{s.price.toLocaleString('en-IN')}</span>
                            <span>•</span>
                            <span>{s.duration} min</span>
                          </div>
                          <p className="text-sm text-[#565755] mt-1">{s.description}</p>
                          <p className="text-xs text-[#565755] italic mt-2 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            25% advance at booking
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDuplicateService(s)}
                          title="Duplicate"
                          className="p-2 text-[#5f5e5e] hover:text-[#ac0053] hover:bg-[#f9f9f9] rounded-full transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteService(s.id)}
                          title="Delete"
                          className="p-2 text-[#5f5e5e] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Service Form */}
              {isAddingService ? (
                <form onSubmit={handleCreateService} className="bg-white border-2 border-[#ac0053] rounded-lg p-5 shadow-md space-y-4">
                  <div className="flex justify-between items-center border-b border-[#eeeeee] pb-3">
                    <h4 className="font-bold text-[#1a1c1c]">Add New Service</h4>
                    <button type="button" onClick={() => setIsAddingService(false)} className="text-[#5f5e5e] hover:text-black">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Service Name</label>
                      <input 
                        type="text" 
                        required 
                        value={newServiceName} 
                        onChange={e => setNewServiceName(e.target.value)}
                        placeholder="e.g. Balayage Color" 
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Category</label>
                      <select 
                        value={newServiceCategory} 
                        onChange={e => setNewServiceCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      >
                        <option value="Haircut">Haircut</option>
                        <option value="Styling">Styling</option>
                        <option value="Color">Color</option>
                        <option value="Treatment">Treatment</option>
                        <option value="Barbering">Barbering</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Price (₹)</label>
                      <input 
                        type="number" 
                        required 
                        value={newServicePrice} 
                        onChange={e => setNewServicePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Duration (mins)</label>
                      <input 
                        type="number" 
                        required 
                        value={newServiceDuration} 
                        onChange={e => setNewServiceDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Description</label>
                    <textarea 
                      value={newServiceDesc} 
                      onChange={e => setNewServiceDesc(e.target.value)}
                      placeholder="Brief details about the service" 
                      rows={2}
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053] resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddingService(false)} className="px-4 py-2 text-sm text-[#5f5e5e] hover:bg-gray-100 rounded-lg">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 text-sm bg-[#ac0053] text-white font-semibold rounded-lg hover:bg-[#ba005b]">
                      Save Service
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setIsAddingService(true)}
                  className="flex items-center justify-center gap-2 w-full py-4 border border-dashed border-[#5f5e5e] hover:border-[#ac0053] hover:text-[#ac0053] text-[#5f5e5e] rounded-lg text-sm font-semibold transition-colors bg-white"
                >
                  <Plus className="w-5 h-5" /> Add Service
                </button>
              )}
            </div>

            <hr className="border-[#eeeeee]" />

            {/* Packages List */}
            <div className="flex flex-col gap-4 pb-24">
              <h3 className="text-xs font-semibold tracking-wider text-[#5f5e5e] uppercase">PACKAGES</h3>
              
              {data.packages.map((p) => (
                <div key={p.id} className="bg-white border border-[#eeeeee] rounded-lg p-5 shadow-sm flex flex-col gap-4 group hover:border-[#ac0053]/40 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="text-[#5f5e5e] cursor-grab pt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-lg font-bold text-[#1a1c1c]">{p.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-[#5f5e5e]">
                          <span className="font-semibold text-[#1a1c1c]">₹{p.price.toLocaleString('en-IN')}</span>
                          <span>•</span>
                          <span>{p.duration} min</span>
                        </div>
                        <p className="text-sm text-[#565755] mt-1">{p.description}</p>
                        <p className="text-xs text-[#565755] italic mt-2 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          25% advance at booking
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleDeletePackage(p.id)}
                        className="p-2 text-[#5f5e5e] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Package Form */}
              {isAddingPackage ? (
                <form onSubmit={handleCreatePackage} className="bg-white border-2 border-[#ac0053] rounded-lg p-5 shadow-md space-y-4">
                  <div className="flex justify-between items-center border-b border-[#eeeeee] pb-3">
                    <h4 className="font-bold text-[#1a1c1c]">Add New Package</h4>
                    <button type="button" onClick={() => setIsAddingPackage(false)} className="text-[#5f5e5e] hover:text-black">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Package Name</label>
                      <input 
                        type="text" 
                        required 
                        value={newPackageName} 
                        onChange={e => setNewPackageName(e.target.value)}
                        placeholder="e.g. Bridal Beauty Special" 
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Price (₹)</label>
                      <input 
                        type="number" 
                        required 
                        value={newPackagePrice} 
                        onChange={e => setNewPackagePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Duration (mins)</label>
                    <input 
                      type="number" 
                      required 
                      value={newPackageDuration} 
                      onChange={e => setNewPackageDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Description</label>
                    <textarea 
                      value={newPackageDesc} 
                      onChange={e => setNewPackageDesc(e.target.value)}
                      placeholder="e.g. Full hair styling, makeup, and manicures" 
                      rows={2}
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053] resize-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddingPackage(false)} className="px-4 py-2 text-sm text-[#5f5e5e] hover:bg-gray-100 rounded-lg">
                      Cancel
                    </button>
                    <button type="submit" className="px-5 py-2 text-sm bg-[#ac0053] text-white font-semibold rounded-lg hover:bg-[#ba005b]">
                      Save Package
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  onClick={() => setIsAddingPackage(true)}
                  className="flex items-center justify-center gap-2 w-full py-4 border border-dashed border-[#5f5e5e] hover:border-[#ac0053] hover:text-[#ac0053] text-[#5f5e5e] rounded-lg text-sm font-semibold transition-colors bg-white"
                >
                  <Plus className="w-5 h-5" /> Add Package
                </button>
              )}
            </div>

          </motion.div>
        </div>

        {/* Bottom Navigation Area */}
        <div className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-[#eeeeee] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] p-4">
          <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-4 md:px-8">
            <button 
              onClick={onPrev}
              className="text-sm font-semibold text-[#5f5e5e] hover:text-[#1a1c1c] transition-colors flex items-center gap-2 py-2 px-4 rounded-lg border border-transparent hover:border-[#eeeeee]"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button 
              onClick={onNext}
              className="bg-[#ac0053] hover:bg-[#ba005b] text-white text-sm font-semibold flex items-center gap-2 px-8 py-3 rounded-lg transition-all shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="hidden md:block w-[45%] h-full">
        <PreviewPane data={data} step={3} />
      </div>
    </div>
  );
}
