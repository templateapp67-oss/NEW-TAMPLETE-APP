import { Sparkles, Mic, ArrowLeft, ArrowRight, Plus, Check, Copy, Trash2, GripVertical, Info, Volume2, X, Search, ChevronDown, List, Pencil, Power } from 'lucide-react';
import { SalonData, Service, Package } from '../types';
import PreviewPane from '../components/PreviewPane';
import { motion, AnimatePresence } from 'motion/react';
import { useState, FormEvent, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  THEME_LABELS,
  getThemeCategories as getStaticThemeCategories,
  getSuggestedServices as getStaticSuggestedServices,
  getServicesForThemeCategory as getStaticServicesForThemeCategory,
  findPredefinedService as findStaticPredefinedService,
  AI_SUGGESTION_NAMES,
  VOICE_SERVICE_BY_THEME,
  normalizeThemeId,
  type PredefinedService,
} from '../lib/themeServices';
import {
  isDatabaseCatalogTheme,
  loadThemeServiceCatalog,
  type ThemeServiceCatalog,
} from '../lib/themeCatalogService';
import {
  deleteSavedService,
  loadSavedServicesForTheme,
  savePredefinedServices,
  setSavedServiceActive,
  updateSavedService,
  type SavedPredefinedService,
} from '../lib/savedServiceService';

// Generates a professional, customer-friendly, category-specific service description.
// Kept offline (rule-based) so it works without any API key, consistent with the app's
// convention that all AI/copy features keep their offline fallbacks. Used for custom
// (non-predefined) services where we don't already have a curated description.
function suggestServiceDescription(category: string, serviceName: string): string {
  const name = serviceName.trim();
  const withName = (base: string) => (name ? `${name} — ${base}` : base);

  switch (category) {
    case 'Haircut':
      return withName('Precision cut tailored to your face shape and hair type for a fresh, polished look.');
    case 'Styling':
      return withName('Professional blow-dry, setting and styling with long-lasting hold for a flawless finish.');
    case 'Color':
      return withName('Vibrant, long-lasting color with even application for rich, healthy-looking shine.');
    case 'Treatment':
      return withName('Deep-nourishing treatment that repairs, hydrates and restores your hair and scalp.');
    case 'Barbering':
      return withName('Precision men’s grooming with clean lines and a sharp, confident finish.');
    case 'Makeup & Beauty':
      return withName('Professional beauty service delivered by our experienced artists.');
    case 'Beard & Shave':
      return withName('Precision beard and shave work for a clean, confident finish.');
    case 'Grooming':
      return withName('Complete men’s grooming for a sharp, well-kept look.');
    case 'Massage':
      return withName('Therapeutic massage to release tension and restore balance.');
    case 'Facials':
      return withName('Reviving facial treatment for healthy, glowing skin.');
    case 'Nails':
      return withName('Expert nail care and finishing for hands and feet.');
    case 'Hair Removal':
      return withName('Hygienic, comfortable hair removal with soothing aftercare.');
    case 'Spa Packages':
      return withName('Curated spa experience combining our most-loved treatments.');
    case 'Haircuts':
      return withName('Precision barbering with clean lines and a sharp, confident finish.');
    case 'Grooming & Treatments':
      return withName('Deep-cleansing grooming and scalp treatments to refresh and revitalise.');
    case 'Styling & Cuts':
      return withName('Editorial precision cutting and styling shaped to your hair type and face.');
    case 'Hair Color':
      return withName('Artistic color with expert placement for a natural, dimensional, glossy finish.');
    case 'Treatments':
      return withName('Advanced repair and gloss treatment to restore strength, shine and vitality.');
    case 'Facial & Skincare':
      return withName('Nourishing facial and skincare treatment for healthy, glowing skin.');
    case 'Spa & Body':
      return withName('Relaxing body massage and spa therapy to melt away tension.');
    case 'Waxing & Threading':
      return withName('Hygienic, comfortable waxing and threading with soothing aftercare.');
    case 'Makeup':
      return withName('Professional makeup artistry for a flawless, long-lasting finish.');
    case 'Hair':
      return withName('Cut, style and colour services for every member of the family.');
    case 'Beauty':
      return withName('Makeup and beauty care delivered by our friendly, experienced artists.');
    case 'Skin':
      return withName('Facials and skin care for a healthy, glowing complexion.');
    case 'Spa':
      return withName('Relaxing massage and spa therapy to melt away stress and tension.');
    case 'Kids':
      return withName('Gentle, fun salon care designed especially for children.');
    case 'Nail Art & Gel':
      return withName('Precision nail shaping, colour and art with a glossy, long-lasting finish.');
    case 'Pedicure & Manicure':
      return withName('Restorative hand and foot care with meticulous prep and a polished finish.');
    case 'Lash & Brow':
      return withName('Beauty-focused lash and brow artistry shaped to complement your features.');
    default:
      return withName('Professional salon service delivered by our experienced team.');
  }
}

interface Props {
  data: SalonData;
  setData: Dispatch<SetStateAction<SalonData>>;
  onNext: () => void;
  onPrev: () => void;
  onSave?: () => void;
}

const savedServiceToUi = (service: SavedPredefinedService): Service => ({
  id: service.id,
  businessId: service.businessId,
  themeId: service.themeId,
  themeKey: service.themeKey,
  categoryId: service.categoryId,
  predefinedServiceId: service.predefinedServiceId,
  name: service.name,
  category: service.category,
  description: service.description,
  price: service.price,
  duration: service.duration,
  featured: service.featured,
  status: service.status,
});

export default function StepServices({ data, setData, onNext, onPrev, onSave }: Props) {
  const theme = normalizeThemeId(data.templateId);
  const usesDatabaseCatalog = isDatabaseCatalogTheme(theme);
  const isFamilyFullService = theme === 'family_full_service';
  const isNailLashStudio = theme === 'nail_lash_studio';

  const [loadedCatalog, setLoadedCatalog] = useState<ThemeServiceCatalog | null>(null);
  const [catalogStatusTheme, setCatalogStatusTheme] = useState<string | null>(
    usesDatabaseCatalog ? theme : null,
  );
  const [catalogLoading, setCatalogLoading] = useState(usesDatabaseCatalog);
  const [catalogError, setCatalogError] = useState('');
  const catalogRequestRef = useRef(0);
  const savedLoadRequestRef = useRef(0);
  const saveRequestRef = useRef(0);

  // Never derive a new theme from the previous response: until the current
  // database request resolves, all five-theme arrays stay empty. The original
  // preserved `hair` theme keeps its pre-existing local catalog unchanged.
  const activeCatalog = usesDatabaseCatalog && loadedCatalog?.theme.themeId === theme
    ? loadedCatalog
    : null;
  const categories = usesDatabaseCatalog
    ? (activeCatalog?.categories.map((category) => category.name) ?? [])
    : getStaticThemeCategories(theme);
  const suggestedList = usesDatabaseCatalog
    ? (activeCatalog?.suggestedServices ?? [])
    : getStaticSuggestedServices(theme);
  const currentCatalogLoading = usesDatabaseCatalog
    && (catalogStatusTheme !== theme || catalogLoading);
  const currentCatalogError = usesDatabaseCatalog && catalogStatusTheme === theme
    ? catalogError
    : '';
  const themeDisplayName = activeCatalog?.theme.name ?? THEME_LABELS[theme];

  const [selectedSuggested, setSelectedSuggested] = useState<string[]>([]);
  const [suggestedFilter, setSuggestedFilter] = useState<'All' | string>('All');
  const [isSavingSelected, setIsSavingSelected] = useState(false);
  const [saveSelectedError, setSaveSelectedError] = useState('');
  const [saveSelectedNotice, setSaveSelectedNotice] = useState('');
  const [savedServicesLoading, setSavedServicesLoading] = useState(usesDatabaseCatalog);
  const [savedServicesError, setSavedServicesError] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState('');
  const [editServiceDescription, setEditServiceDescription] = useState('');
  const [editServicePrice, setEditServicePrice] = useState(0);
  const [editServiceDuration, setEditServiceDuration] = useState(30);
  const [managingServiceId, setManagingServiceId] = useState<string | null>(null);
  const [isAddingService, setIsAddingService] = useState(false);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // New Service Form state
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(50);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceCategory, setNewServiceCategory] = useState(categories[0] || 'General');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  // Tracks whether the user hand-wrote the description, so we never silently
  // overwrite their work when the category (or service name) changes.
  const [newServiceDescTouched, setNewServiceDescTouched] = useState(false);
  const [pendingDescSuggestion, setPendingDescSuggestion] = useState('');
  const [showDescConfirm, setShowDescConfirm] = useState(false);

  // Service Name combobox state
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [customService, setCustomService] = useState(false);
  const serviceComboRef = useRef<HTMLDivElement>(null);
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New Package Form state
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackagePrice, setNewPackagePrice] = useState(95);
  const [newPackageDuration, setNewPackageDuration] = useState(60);
  const [newPackageDesc, setNewPackageDesc] = useState('');

  // Load exactly one of the five seeded catalogs through the M19 RPC. The RPC
  // applies themes.theme_id filtering in SQL; this component never downloads a
  // global catalog for client-only filtering.
  useEffect(() => {
    const requestId = catalogRequestRef.current + 1;
    catalogRequestRef.current = requestId;
    let cancelled = false;

    // Clear first so a theme switch cannot paint a previous theme for one frame.
    setLoadedCatalog(null);
    setCatalogStatusTheme(usesDatabaseCatalog ? theme : null);
    setCatalogError('');

    if (!usesDatabaseCatalog) {
      setCatalogLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setCatalogLoading(true);
    loadThemeServiceCatalog(theme)
      .then((catalog) => {
        if (cancelled || catalogRequestRef.current !== requestId) return;
        setLoadedCatalog(catalog);
        setCatalogLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled || catalogRequestRef.current !== requestId) return;
        setLoadedCatalog(null);
        setCatalogLoading(false);
        setCatalogError(error instanceof Error ? error.message : 'Unable to load this theme’s service catalog.');
      });

    return () => {
      cancelled = true;
    };
  }, [theme, usesDatabaseCatalog]);

  // Database themes always hydrate saved salon services from the authenticated
  // tenant after mount/refresh. Clear localStorage/snapshot rows immediately so
  // they cannot flash while the current theme-scoped request is in flight.
  useEffect(() => {
    const requestId = savedLoadRequestRef.current + 1;
    savedLoadRequestRef.current = requestId;
    let cancelled = false;
    setSavedServicesError('');
    setEditingServiceId(null);
    setManagingServiceId(null);

    if (!usesDatabaseCatalog) {
      setSavedServicesLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setSavedServicesLoading(true);
    setData((previous) => normalizeThemeId(previous.templateId) === theme
      ? { ...previous, services: [] }
      : previous
    );

    loadSavedServicesForTheme(theme)
      .then((services) => {
        if (cancelled || savedLoadRequestRef.current !== requestId) return;
        setData((previous) => normalizeThemeId(previous.templateId) === theme
          ? { ...previous, services: services.map(savedServiceToUi) }
          : previous
        );
        setSavedServicesLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled || savedLoadRequestRef.current !== requestId) return;
        setSavedServicesLoading(false);
        setSavedServicesError(error instanceof Error ? error.message : 'Unable to load saved services.');
      });

    return () => {
      cancelled = true;
    };
  }, [theme, usesDatabaseCatalog, setData]);

  // When the theme changes, clear ALL theme-specific selections and temporary
  // buffers so nothing from a previous theme leaks into the current one:
  //   - selected suggested services
  //   - the suggested category filter
  //   - the add-service category / predefined service selection
  //   - temporary service + package form buffers
  //   - any open form/action state
  useEffect(() => {
    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }

    // Suggested-services selection/save buffers
    saveRequestRef.current += 1;
    setSelectedSuggested([]);
    setSuggestedFilter('All');
    setIsSavingSelected(false);
    setSaveSelectedError('');
    setSaveSelectedNotice('');
    setEditingServiceId(null);
    setEditServiceName('');
    setEditServiceDescription('');
    setEditServicePrice(0);
    setEditServiceDuration(30);
    setManagingServiceId(null);

    // Add-service form: database themes intentionally start empty until their
    // current theme-scoped response arrives; the original theme stays unchanged.
    const firstCategory = usesDatabaseCatalog
      ? ''
      : (getStaticThemeCategories(theme)[0] || 'General');
    setNewServiceCategory(firstCategory);
    setNewServiceName('');
    setNewServicePrice(50);
    setNewServiceDuration(30);
    setNewServiceDesc(suggestServiceDescription(firstCategory, ''));
    setNewServiceDescTouched(false);
    setCustomService(false);
    setServiceDropdownOpen(false);
    setShowDescConfirm(false);
    setPendingDescSuggestion('');

    // Close any open add-forms and reset fast-action state
    setIsAddingService(false);
    setIsAddingPackage(false);
    setIsSpeaking(false);

    // Package form buffers
    setNewPackageName('');
    setNewPackagePrice(95);
    setNewPackageDuration(60);
    setNewPackageDesc('');
    // Intentionally only depends on [theme]; the individual setState calls above
    // cover every piece of theme-scoped state, so no other deps are needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      if (speechTimerRef.current) {
        clearTimeout(speechTimerRef.current);
        speechTimerRef.current = null;
      }
    };
  }, [theme]);

  // Initialise category/form copy only after the current database theme arrives.
  // activeCatalog is identity-checked above, so a late previous-theme response
  // can never initialise this form.
  useEffect(() => {
    if (!usesDatabaseCatalog || !activeCatalog) return;
    const firstCategory = activeCatalog.categories[0]?.name || '';
    setNewServiceCategory(firstCategory);
    setNewServiceDesc(suggestServiceDescription(firstCategory || 'General', ''));
    setNewServiceDescTouched(false);
  }, [activeCatalog, usesDatabaseCatalog]);

  // Close the service combobox when clicking outside it.
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (serviceComboRef.current && !serviceComboRef.current.contains(e.target as Node)) {
        setServiceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const findCurrentPredefinedService = (value: string): PredefinedService | undefined => {
    if (!usesDatabaseCatalog) return findStaticPredefinedService(theme, value);
    const query = value.trim().toLowerCase();
    if (!query || !activeCatalog) return undefined;
    return activeCatalog.predefinedServices.find((service) =>
      service.name.toLowerCase() === query
      || service.suggestedLabel?.toLowerCase() === query
    );
  };

  const visibleSuggested =
    suggestedFilter === 'All'
      ? suggestedList
      : suggestedList.filter((s) => s.category === suggestedFilter);

  const allVisibleSelected =
    visibleSuggested.length > 0 && visibleSuggested.every((s) => selectedSuggested.includes(s.name));

  const toggleSuggested = (name: string) => {
    setSelectedSuggested((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const selectAllSuggested = () => {
    if (allVisibleSelected) {
      setSelectedSuggested((prev) => prev.filter((n) => !visibleSuggested.some((s) => s.name === n)));
    } else {
      setSelectedSuggested((prev) =>
        Array.from(new Set([...prev, ...visibleSuggested.map((s) => s.name)]))
      );
    }
  };

  const handleAddSelected = async () => {
    if (selectedSuggested.length === 0 || isSavingSelected) return;

    // Preserve the original Existing Theme behavior. Session 2 database saving
    // applies only to the five M18/M19 database catalogs.
    if (!isDatabaseCatalogTheme(theme)) {
      const newServices: Service[] = selectedSuggested.map((sName) => {
        const found = suggestedList.find((service) => service.name === sName);
        return {
          id: 's-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          name: found ? found.name : sName,
          category: found ? found.category : 'General',
          description: found ? found.description : 'Professional service provided by experienced stylists.',
          price: found ? found.price : 50,
          duration: found ? found.duration : 30,
        };
      });
      setData({ ...data, services: [...data.services, ...newServices] });
      setSelectedSuggested([]);
      if (onSave) onSave();
      return;
    }

    if (!activeCatalog) {
      setSaveSelectedError('Wait for this theme’s services to finish loading.');
      return;
    }

    // Resolve selected chips only through the current RPC response. No name-only
    // or cross-theme predefined relationship is sent to the database.
    const selectedRows = activeCatalog.suggestedServices.filter((service) =>
      selectedSuggested.includes(service.name)
    );
    if (selectedRows.length !== selectedSuggested.length) {
      setSaveSelectedError('The selected services are no longer available for this theme.');
      return;
    }

    const requestId = saveRequestRef.current + 1;
    saveRequestRef.current = requestId;
    setIsSavingSelected(true);
    setSaveSelectedError('');
    setSaveSelectedNotice('');

    try {
      const result = await savePredefinedServices(
        theme,
        selectedRows.map((service) => service.id),
      );
      if (saveRequestRef.current !== requestId) return;

      // Keep local preview state aligned with returned canonical saved rows, but
      // never add the same predefined service twice on repeated clicks.
      const localPredefinedIds = new Set(
        data.services
          .map((service) => service.predefinedServiceId)
          .filter((id): id is string => Boolean(id)),
      );
      const newlyVisibleServices: Service[] = result.services
        .filter((service) => !localPredefinedIds.has(service.predefinedServiceId))
        .map((service) => ({
          id: service.id,
          businessId: service.businessId,
          themeId: service.themeId,
          themeKey: service.themeKey,
          categoryId: service.categoryId,
          predefinedServiceId: service.predefinedServiceId,
          name: service.name,
          category: service.category,
          description: service.description,
          price: service.price,
          duration: service.duration,
          featured: service.featured,
          status: service.status,
        }));

      if (newlyVisibleServices.length > 0) {
        setData((previous) => normalizeThemeId(previous.templateId) === theme
          ? {
              ...previous,
              services: [
                ...previous.services,
                ...newlyVisibleServices.filter((incoming) =>
                  !previous.services.some((existing) =>
                    existing.predefinedServiceId === incoming.predefinedServiceId
                  )
                ),
              ],
            }
          : previous
        );
      }
      setSelectedSuggested([]);
      setSaveSelectedNotice(
        result.insertedCount > 0
          ? `${result.insertedCount} service${result.insertedCount === 1 ? '' : 's'} saved.`
          : 'Selected services are already saved.',
      );
      if (onSave) onSave();
    } catch (error) {
      if (saveRequestRef.current !== requestId) return;
      setSaveSelectedError(error instanceof Error ? error.message : 'Unable to save the selected services.');
    } finally {
      if (saveRequestRef.current === requestId) setIsSavingSelected(false);
    }
  };

  const handleAISuggest = () => {
    if (isFamilyFullService || isNailLashStudio) return;
    const names = AI_SUGGESTION_NAMES[theme as keyof typeof AI_SUGGESTION_NAMES];
    if (!names) return;
    const aiAdded: Service[] = names.map((n, i) => {
      const found = findCurrentPredefinedService(n);
      return {
        id: 'ai-' + Date.now() + '-' + i,
        name: found ? found.name : n,
        category: found ? found.category : (categories[0] || 'General'),
        description: found ? found.description : 'AI-suggested premium service for your salon.',
        price: found ? found.price : 50,
        duration: found ? found.duration : 30,
        featured: i === 0,
      };
    });
    setData({
      ...data,
      services: [...data.services, ...aiAdded],
    });
    if (onSave) onSave();
  };

  const handleSpeechInput = () => {
    if (isFamilyFullService || isNailLashStudio) return;
    setIsSpeaking(true);
    speechTimerRef.current = setTimeout(() => {
      speechTimerRef.current = null;
      setIsSpeaking(false);
      const v = VOICE_SERVICE_BY_THEME[theme as keyof typeof VOICE_SERVICE_BY_THEME];
      if (!v) return;
      const voiceService: Service = {
        id: 'v-' + Date.now(),
        name: v.name,
        category: v.category,
        description: v.description,
        price: v.price,
        duration: v.duration,
      };
      setData({
        ...data,
        services: [...data.services, voiceService],
      });
      if (onSave) onSave();
    }, 1500);
  };

  const handleOpenAddService = () => {
    setIsAddingService(true);
    setCustomService(false);
    setServiceDropdownOpen(false);
    setNewServiceName('');
    setNewServiceDesc(suggestServiceDescription(newServiceCategory, ''));
    setNewServiceDescTouched(false);
    setShowDescConfirm(false);
    setPendingDescSuggestion('');
  };

  const handleServiceNameInput = (value: string) => {
    setNewServiceName(value);
    if (!serviceDropdownOpen) setServiceDropdownOpen(true);
    if (customService) return;
    const match = findCurrentPredefinedService(value);
    if (match) {
      // Exact predefined match (or a family suggested alias) → canonicalise
      // the name and auto-fill the rest of the form.
      setNewServiceName(match.name);
      setNewServiceCategory(match.category);
      setNewServicePrice(match.price);
      setNewServiceDuration(match.duration);
      setNewServiceDesc(match.description);
      setNewServiceDescTouched(false);
    } else if (!newServiceDescTouched) {
      // Still typing → keep a live, relevant description suggestion.
      setNewServiceDesc(suggestServiceDescription(newServiceCategory, value));
    }
  };

  const selectPredefined = (s: PredefinedService) => {
    setNewServiceName(s.name);
    setNewServiceCategory(s.category);
    setNewServicePrice(s.price);
    setNewServiceDuration(s.duration);
    setNewServiceDesc(s.description);
    setNewServiceDescTouched(false);
    setCustomService(false);
    setServiceDropdownOpen(false);
    setShowDescConfirm(false);
    setPendingDescSuggestion('');
  };

  const enableCustom = () => {
    setCustomService(true);
    setNewServiceName('');
    setNewServiceDesc(suggestServiceDescription(newServiceCategory, ''));
    setNewServiceDescTouched(false);
    setNewServicePrice(50);
    setNewServiceDuration(30);
    setServiceDropdownOpen(false);
  };

  const backToPredefined = () => {
    setCustomService(false);
    setNewServiceName('');
    setServiceDropdownOpen(true);
  };

  const handleCategoryChange = (cat: string) => {
    setNewServiceCategory(cat);
    setServiceDropdownOpen(true);
    if (!customService) {
      // Service names differ per category — reset the selection.
      setNewServiceName('');
      setNewServicePrice(50);
      setNewServiceDuration(30);
      setNewServiceDesc(suggestServiceDescription(cat, ''));
      setNewServiceDescTouched(false);
    } else {
      setNewServiceDesc(suggestServiceDescription(cat, newServiceName));
      setNewServiceDescTouched(false);
    }
    setShowDescConfirm(false);
    setPendingDescSuggestion('');
  };

  const handleServiceDescChange = (value: string) => {
    setNewServiceDesc(value);
    setNewServiceDescTouched(true);
    setShowDescConfirm(false);
    setPendingDescSuggestion('');
  };

  const applyDescSuggestion = (suggestion: string) => {
    setNewServiceDesc(suggestion);
    setNewServiceDescTouched(false);
    setShowDescConfirm(false);
    setPendingDescSuggestion('');
  };

  const handleCreateService = (e: FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const created: Service = {
      id: 'custom-' + Date.now(),
      themeId: null,
      categoryId: null,
      predefinedServiceId: null,
      name: newServiceName,
      category: newServiceCategory || 'General',
      description: newServiceDesc || 'Custom salon service.',
      price: Number(newServicePrice) || 0,
      duration: Number(newServiceDuration) || 30,
    };
    setData({
      ...data,
      services: [...data.services, created],
    });
    setNewServiceName('');
    setNewServiceDesc('');
    setNewServiceDescTouched(false);
    setCustomService(false);
    setServiceDropdownOpen(false);
    setShowDescConfirm(false);
    setPendingDescSuggestion('');
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
      duration: Number(newPackageDuration) || 60,
    };
    setData({
      ...data,
      packages: [...data.packages, created],
    });
    setNewPackageName('');
    setNewPackageDesc('');
    setIsAddingPackage(false);
    if (onSave) onSave();
  };

  const beginEditService = (service: Service) => {
    if (!service.businessId || !isDatabaseCatalogTheme(theme)) return;
    setEditingServiceId(service.id);
    setEditServiceName(service.name);
    setEditServiceDescription(service.description);
    setEditServicePrice(service.price);
    setEditServiceDuration(service.duration);
    setSavedServicesError('');
  };

  const handleUpdateSavedService = async (service: Service) => {
    if (!isDatabaseCatalogTheme(theme) || !service.businessId) return;
    const requestId = saveRequestRef.current + 1;
    saveRequestRef.current = requestId;
    setManagingServiceId(service.id);
    setSavedServicesError('');
    try {
      const updated = await updateSavedService(theme, service.id, {
        name: editServiceName,
        description: editServiceDescription,
        price: editServicePrice,
        duration: editServiceDuration,
      });
      if (saveRequestRef.current !== requestId) return;
      setData((previous) => ({
        ...previous,
        services: previous.services.map((item) =>
          item.id === service.id ? savedServiceToUi(updated) : item
        ),
      }));
      setEditingServiceId(null);
      if (onSave) onSave();
    } catch (error) {
      if (saveRequestRef.current !== requestId) return;
      setSavedServicesError(error instanceof Error ? error.message : 'Unable to update this service.');
    } finally {
      if (saveRequestRef.current === requestId) setManagingServiceId(null);
    }
  };

  const handleToggleSavedService = async (service: Service) => {
    if (!isDatabaseCatalogTheme(theme) || !service.businessId) return;
    const requestId = saveRequestRef.current + 1;
    saveRequestRef.current = requestId;
    setManagingServiceId(service.id);
    setSavedServicesError('');
    try {
      const updated = await setSavedServiceActive(theme, service.id, service.status !== 'active');
      if (saveRequestRef.current !== requestId) return;
      setData((previous) => ({
        ...previous,
        services: previous.services.map((item) =>
          item.id === service.id ? savedServiceToUi(updated) : item
        ),
      }));
      if (onSave) onSave();
    } catch (error) {
      if (saveRequestRef.current !== requestId) return;
      setSavedServicesError(error instanceof Error ? error.message : 'Unable to change service status.');
    } finally {
      if (saveRequestRef.current === requestId) setManagingServiceId(null);
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (service.businessId && isDatabaseCatalogTheme(theme)) {
      const requestId = saveRequestRef.current + 1;
      saveRequestRef.current = requestId;
      setManagingServiceId(service.id);
      setSavedServicesError('');
      try {
        await deleteSavedService(service.id);
        if (saveRequestRef.current !== requestId) return;
      } catch (error) {
        if (saveRequestRef.current !== requestId) return;
        setSavedServicesError(error instanceof Error ? error.message : 'Unable to delete this service.');
        setManagingServiceId(null);
        return;
      }
      if (saveRequestRef.current === requestId) setManagingServiceId(null);
    }
    setData((previous) => ({
      ...previous,
      services: previous.services.filter((item) => item.id !== service.id),
    }));
    if (onSave) onSave();
  };

  const handleDuplicateService = (s: Service) => {
    const dup: Service = {
      ...s,
      id: 'dup-' + Date.now(),
      businessId: undefined,
      themeId: null,
      themeKey: undefined,
      categoryId: null,
      predefinedServiceId: null,
      status: 'active',
      name: `${s.name} (Copy)`,
    };
    setData((previous) => ({
      ...previous,
      services: [...previous.services, dup],
    }));
    if (onSave) onSave();
  };

  const handleDeletePackage = (id: string) => {
    setData({
      ...data,
      packages: data.packages.filter((p) => p.id !== id),
    });
    if (onSave) onSave();
  };

  // Service-name combobox: the list of selectable names is filtered by the
  // currently chosen category AND the current theme.
  const serviceQuery = newServiceName.trim().toLowerCase();
  const categoryServices = usesDatabaseCatalog
    ? (activeCatalog?.predefinedServices.filter((service) => service.category === newServiceCategory) ?? [])
    : getStaticServicesForThemeCategory(theme, newServiceCategory);
  const filteredServices = customService
    ? []
    : categoryServices.filter((s) => s.name.toLowerCase().includes(serviceQuery));

  const chipClass = (active: boolean) =>
    `px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
      active
        ? 'border-[#ac0053] bg-[#ffd9e1] text-[#3f001a]'
        : 'border-[#eeeeee] bg-[#f9f9f9] text-[#1a1c1c] hover:border-[#ac0053] hover:text-[#ac0053]'
    }`;

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

            {/* Suggested Services — theme-specific */}
            <div className="bg-white rounded-lg border border-[#eeeeee] p-6 shadow-sm flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-[#1a1c1c] uppercase tracking-wider">Suggested for {themeDisplayName}</h3>
                  <p className="text-xs text-[#5f5e5e] mt-0.5">Curated to match your selected website style.</p>
                </div>
                <button
                  onClick={selectAllSuggested}
                  className="text-xs font-semibold text-[#ac0053] hover:underline self-start sm:self-auto"
                >
                  {allVisibleSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* Category filter (per theme) */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setSuggestedFilter('All')} className={chipClass(suggestedFilter === 'All')}>
                  All
                </button>
                {categories.map((c) => (
                  <button key={c} onClick={() => setSuggestedFilter(c)} className={chipClass(suggestedFilter === c)}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {currentCatalogLoading && (
                  <p className="text-sm text-[#5f5e5e]">Loading services…</p>
                )}
                {!currentCatalogLoading && currentCatalogError && (
                  <p className="text-sm text-red-600" role="alert">{currentCatalogError}</p>
                )}
                {!currentCatalogLoading && !currentCatalogError && visibleSuggested.map((s) => {
                  const isSelected = selectedSuggested.includes(s.name);
                  return (
                    <button
                      key={s.name}
                      onClick={() => toggleSuggested(s.name)}
                      title={s.description}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'border-[#ac0053] bg-[#ffd9e1] text-[#3f001a]'
                          : 'border-[#eeeeee] bg-[#f9f9f9] text-[#1a1c1c] hover:border-[#ac0053] hover:text-[#ac0053]'
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4 text-[#ac0053]" /> : <Plus className="w-4 h-4 text-[#5f5e5e]" />}
                      {s.suggestedLabel || s.name}
                    </button>
                  );
                })}
                {!currentCatalogLoading && !currentCatalogError && visibleSuggested.length === 0 && (
                  <p className="text-sm text-[#5f5e5e]">No suggested services in this category.</p>
                )}
              </div>
              <div className="pt-2">
                <button
                  onClick={handleAddSelected}
                  disabled={selectedSuggested.length === 0 || isSavingSelected || currentCatalogLoading}
                  className="bg-[#ac0053] text-white font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-[#ba005b] transition-colors disabled:opacity-40"
                >
                  {isSavingSelected ? 'Saving…' : `Add Selected (${selectedSuggested.length})`}
                </button>
                {saveSelectedError && (
                  <p className="text-xs text-red-600 mt-2" role="alert">{saveSelectedError}</p>
                )}
                {saveSelectedNotice && !saveSelectedError && (
                  <p className="text-xs text-emerald-700 mt-2" role="status">{saveSelectedNotice}</p>
                )}
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
              {savedServicesLoading && usesDatabaseCatalog && (
                <p className="text-xs text-[#5f5e5e]">Loading saved services…</p>
              )}
              {savedServicesError && (
                <p className="text-xs text-red-600" role="alert">{savedServicesError}</p>
              )}

              <AnimatePresence>
                {data.services.map((s) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={s.id}
                    className={`bg-white border border-[#eeeeee] rounded-lg p-5 shadow-sm flex flex-col gap-4 group hover:border-[#ac0053]/40 transition-colors ${s.status === 'inactive' ? 'opacity-65' : ''}`}
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
                            {s.status === 'inactive' && (
                              <span className="bg-gray-100 text-gray-600 font-medium text-[10px] px-2 py-0.5 rounded-full">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#5f5e5e]">
                            <span className="font-semibold text-[#1a1c1c]">₹{s.price.toLocaleString('en-IN')}</span>
                            <span>•</span>
                            <span>{s.duration} min</span>
                            <span>•</span>
                            <span className="italic">{s.category}</span>
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
                        {s.businessId && (
                          <>
                            <button
                              onClick={() => beginEditService(s)}
                              disabled={managingServiceId === s.id}
                              title="Edit Service"
                              className="p-2 text-[#5f5e5e] hover:text-[#ac0053] hover:bg-[#f9f9f9] rounded-full transition-colors disabled:opacity-40"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleSavedService(s)}
                              disabled={managingServiceId === s.id}
                              title={s.status === 'active' ? 'Deactivate Service' : 'Activate Service'}
                              className="p-2 text-[#5f5e5e] hover:text-[#ac0053] hover:bg-[#f9f9f9] rounded-full transition-colors disabled:opacity-40"
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDuplicateService(s)}
                          title="Duplicate"
                          className="p-2 text-[#5f5e5e] hover:text-[#ac0053] hover:bg-[#f9f9f9] rounded-full transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(s)}
                          disabled={managingServiceId === s.id}
                          title="Delete"
                          className="p-2 text-[#5f5e5e] hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {editingServiceId === s.id && (
                      <div className="border-t border-[#eeeeee] pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          value={editServiceName}
                          onChange={(event) => setEditServiceName(event.target.value)}
                          placeholder="Service name"
                          className="px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                        />
                        <input
                          type="number"
                          min="0"
                          value={editServicePrice}
                          onChange={(event) => setEditServicePrice(Number(event.target.value))}
                          placeholder="Price"
                          className="px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                        />
                        <input
                          type="number"
                          min="1"
                          value={editServiceDuration}
                          onChange={(event) => setEditServiceDuration(Number(event.target.value))}
                          placeholder="Duration"
                          className="px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                        />
                        <textarea
                          value={editServiceDescription}
                          onChange={(event) => setEditServiceDescription(event.target.value)}
                          placeholder="Description"
                          rows={2}
                          className="px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053] resize-none"
                        />
                        <div className="md:col-span-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingServiceId(null)}
                            className="px-4 py-2 border border-[#eeeeee] rounded-lg text-xs font-semibold text-[#5f5e5e]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateSavedService(s)}
                            disabled={managingServiceId === s.id || !editServiceName.trim()}
                            className="px-4 py-2 bg-[#ac0053] text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                          >
                            {managingServiceId === s.id ? 'Saving…' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    )}
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
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Category</label>
                      <select
                        value={newServiceCategory}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">
                        Service Name
                        {customService && <span className="ml-2 text-[10px] font-normal text-[#ac0053]">Custom</span>}
                      </label>
                      {/* Searchable predefined service-name combobox */}
                      <div className="relative" ref={serviceComboRef}>
                        <div className="relative">
                          <Search className="w-4 h-4 text-[#5f5e5e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            required
                            value={newServiceName}
                            onChange={(e) => handleServiceNameInput(e.target.value)}
                            onFocus={() => setServiceDropdownOpen(true)}
                            placeholder={customService ? 'Type your custom service name' : `Search ${themeDisplayName} services…`}
                            className="w-full pl-9 pr-9 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                          />
                          <ChevronDown
                            className={`w-4 h-4 text-[#5f5e5e] absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${serviceDropdownOpen ? 'rotate-180' : ''}`}
                          />
                        </div>

                        {serviceDropdownOpen && (
                          <div className="absolute z-30 mt-1 w-full bg-white border border-[#eeeeee] rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                            {customService ? (
                              <button
                                type="button"
                                onClick={backToPredefined}
                                className="w-full text-left px-3 py-2.5 text-sm text-[#ac0053] hover:bg-[#fff1f4] flex items-center gap-2"
                              >
                                <List className="w-4 h-4" /> Choose from predefined list
                              </button>
                            ) : (
                              <>
                                {filteredServices.length === 0 ? (
                                  <div className="px-3 py-3 text-sm text-[#5f5e5e]">
                                    No matching service — add your own via “Other / Custom”.
                                  </div>
                                ) : (
                                  filteredServices.map((s) => (
                                    <button
                                      type="button"
                                      key={s.name}
                                      onClick={() => selectPredefined(s)}
                                      className="w-full text-left px-3 py-2.5 hover:bg-[#fff1f4] flex items-center justify-between gap-3 border-b border-[#f3f3f3] last:border-0"
                                    >
                                      <span className="text-sm font-medium text-[#1a1c1c]">{s.name}</span>
                                      <span className="text-xs text-[#5f5e5e] whitespace-nowrap">
                                        ₹{s.price.toLocaleString('en-IN')} • {s.duration}m
                                      </span>
                                    </button>
                                  ))
                                )}
                                <button
                                  type="button"
                                  onClick={enableCustom}
                                  className="w-full text-left px-3 py-2.5 text-sm font-semibold text-[#ac0053] hover:bg-[#fff1f4] flex items-center gap-2"
                                >
                                  <Plus className="w-4 h-4" /> Other / Custom Service
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5f5e5e] mt-1">
                        Pick from the list — no need to type. Use “Other / Custom” only if your service isn’t listed.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Price (₹)</label>
                      <input
                        type="number"
                        required
                        value={newServicePrice}
                        onChange={(e) => setNewServicePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Duration (mins)</label>
                      <input
                        type="number"
                        required
                        value={newServiceDuration}
                        onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#1a1c1c]">Description</label>
                      <button
                        type="button"
                        onClick={() => applyDescSuggestion(suggestServiceDescription(newServiceCategory, newServiceName))}
                        className="flex items-center gap-1 text-xs font-semibold text-[#ac0053] hover:underline"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Generate suggestion
                      </button>
                    </div>
                    <textarea
                      value={newServiceDesc}
                      onChange={(e) => handleServiceDescChange(e.target.value)}
                      placeholder="Brief details about the service"
                      rows={2}
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053] resize-none"
                    />
                    {showDescConfirm && (
                      <div className="mt-2 rounded-lg border border-[#ac0053]/30 bg-[#fff1f4] p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-xs text-[#5f5e5e]">
                          Category changed to <span className="font-semibold text-[#1a1c1c]">{newServiceCategory}</span>. Replace your description with a suggested one?
                        </p>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => applyDescSuggestion(pendingDescSuggestion)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-[#ac0053] rounded-lg hover:bg-[#ba005b]"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDescConfirm(false)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#5f5e5e] bg-white border border-[#eeeeee] rounded-lg hover:bg-gray-50"
                          >
                            Keep mine
                          </button>
                        </div>
                      </div>
                    )}
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
                  onClick={handleOpenAddService}
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
                        onChange={(e) => setNewPackageName(e.target.value)}
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
                        onChange={(e) => setNewPackagePrice(Number(e.target.value))}
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
                      onChange={(e) => setNewPackageDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#eeeeee] rounded-lg text-sm outline-none focus:border-[#ac0053]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1a1c1c] mb-1">Description</label>
                    <textarea
                      value={newPackageDesc}
                      onChange={(e) => setNewPackageDesc(e.target.value)}
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
