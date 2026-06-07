import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Scale, Package, Loader2, CheckCircle2, ChevronLeft,
  Minus, Plus, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../../api/client';
import AppLayout from '../../components/AppLayout';
import { formatFcfa } from '../../utils/currency';

type Step = 'intro' | 'weight' | 'product' | 'analyzing' | 'result';

interface AnalysisResult {
  categoryId: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryHint: string;
  weightKg: number;
  weightConfidence: number;
  length: number;
  width: number;
  height: number;
  description: string;
  estimatedPrice: number;
  currency: 'XOF';
  estimatedMinutes: number;
  distanceKm: number;
  breakdown: {
    tarifBase: number;
    partDistance: number;
    partPoids: number;
    supplementZone: number;
    distanceKm: number;
    weightKg: number;
  };
  message: string;
}

function PhotoCapture({
  label,
  hint,
  icon: Icon,
  preview,
  onCapture,
}: {
  label: string;
  hint: string;
  icon: typeof Camera;
  preview: string | null;
  onCapture: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center">
      {preview ? (
        <img
          src={preview}
          alt="Aperçu"
          className="mx-auto mb-4 max-h-56 w-full rounded-xl object-cover shadow-md"
        />
      ) : (
        <div className="mx-auto mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-100">
          <Icon className="h-16 w-16 text-emerald-600" />
        </div>
      )}
      <h3 className="text-xl font-bold text-slate-800">{label}</h3>
      <p className="mt-2 text-sm text-slate-600">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onCapture(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-emerald-700"
      >
        <Camera className="h-6 w-6" />
        {preview ? 'Reprendre la photo' : 'Prendre la photo'}
      </button>
    </div>
  );
}

export default function NewPackagePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('intro');
  const [weightFile, setWeightFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [weightPreview, setWeightPreview] = useState<string | null>(null);
  const [productPreview, setProductPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [weight, setWeight] = useState(2);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    weight: 2,
    description: '',
  });

  useEffect(() => {
    return () => {
      if (weightPreview) URL.revokeObjectURL(weightPreview);
      if (productPreview) URL.revokeObjectURL(productPreview);
    };
  }, [weightPreview, productPreview]);

  function handleWeightCapture(file: File) {
    setWeightFile(file);
    setWeightPreview(URL.createObjectURL(file));
    setStep('product');
  }

  function handleProductCapture(file: File) {
    setProductFile(file);
    setProductPreview(URL.createObjectURL(file));
  }

  async function runAnalysis() {
    if (!weightFile || !productFile) {
      setError('Les deux photos sont nécessaires');
      return;
    }
    setError('');
    setStep('analyzing');
    try {
      const fd = new FormData();
      fd.append('weightPhoto', weightFile);
      fd.append('productPhoto', productFile);
      const { data } = await api.post<AnalysisResult>('/packages/analyze', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysis(data);
      setWeight(data.weightKg);
      setStep('result');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Analyse impossible. Réessayez.');
      setStep('product');
    }
  }

  const refreshEstimate = useCallback(async (newWeight: number, categoryId?: string) => {
    try {
      const { data } = await api.post<{
        estimatedPrice: number;
        estimatedMinutes: number;
        distanceKm: number;
        breakdown: AnalysisResult['breakdown'];
      }>('/packages/estimate', { weight: newWeight, categoryId });
      setAnalysis((prev) =>
        prev
          ? {
              ...prev,
              weightKg: newWeight,
              estimatedPrice: data.estimatedPrice,
              estimatedMinutes: data.estimatedMinutes,
              distanceKm: data.distanceKm,
              breakdown: data.breakdown,
            }
          : prev
      );
    } catch {
      /* ignore estimate errors */
    }
  }, []);

  useEffect(() => {
    if (step !== 'result' || !analysis) return;
    const t = setTimeout(() => refreshEstimate(weight, analysis.categoryId), 400);
    return () => clearTimeout(t);
  }, [weight, step, analysis?.categoryId, refreshEstimate]);

  function adjustWeight(delta: number) {
    setWeight((w) => Math.max(0.5, Math.round((w + delta) * 2) / 2));
  }

  async function handleConfirm() {
    if (!analysis) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/packages', {
        weight,
        length: analysis.length,
        width: analysis.width,
        height: analysis.height,
        category: analysis.categoryId,
        description: analysis.description,
      });
      navigate('/merchant/packages');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Création impossible');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/packages', {
        weight: manualForm.weight,
        description: manualForm.description || undefined,
      });
      navigate('/merchant/packages');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      setError(msg || 'Création impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout title="Nouveau colis">
      <div className="mx-auto max-w-2xl">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        )}

        {step === 'intro' && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8" />
                <h2 className="text-2xl font-bold">Mode simple — 2 photos</h2>
              </div>
              <p className="mt-4 text-lg text-emerald-50">
                Pas besoin de taper le poids ni les dimensions. Prenez une photo de la balance,
                puis une photo de votre marchandise. kikchee fait le reste.
              </p>
              <ol className="mt-6 space-y-3 text-emerald-50">
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 font-bold">1</span>
                  Photo du poids sur la balance
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 font-bold">2</span>
                  Photo de la marchandise
                </li>
                <li className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 font-bold">3</span>
                  Valider — catégorie et prix calculés automatiquement
                </li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setStep('weight')}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-5 text-xl font-bold text-white shadow-lg hover:bg-emerald-700"
            >
              <Camera className="h-7 w-7" />
              Commencer avec les photos
            </button>
          </div>
        )}

        {step === 'weight' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setStep('intro')}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-emerald-700"
            >
              <ChevronLeft className="h-4 w-4" /> Retour
            </button>
            <PhotoCapture
              label="Photo du poids"
              hint="Placez la marchandise sur la balance et photographiez l'écran ou l'aiguille"
              icon={Scale}
              preview={weightPreview}
              onCapture={handleWeightCapture}
            />
          </div>
        )}

        {step === 'product' && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setStep('weight')}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-emerald-700"
            >
              <ChevronLeft className="h-4 w-4" /> Photo du poids
            </button>
            <PhotoCapture
              label="Photo de la marchandise"
              hint="Montrez clairement ce que vous envoyez (sac, carton, produits…)"
              icon={Package}
              preview={productPreview}
              onCapture={handleProductCapture}
            />
            {productFile && (
              <button
                type="button"
                onClick={runAnalysis}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-5 text-xl font-bold text-white shadow-lg hover:bg-emerald-700"
              >
                <Sparkles className="h-7 w-7" />
                Analyser avec kikchee
              </button>
            )}
          </div>
        )}

        {step === 'analyzing' && (
          <div className="rounded-2xl border bg-white p-12 text-center shadow-sm">
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-emerald-600" />
            <h3 className="mt-6 text-xl font-bold text-slate-800">Analyse en cours…</h3>
            <p className="mt-2 text-slate-600">
              Reconnaissance de la marchandise et lecture du poids
            </p>
          </div>
        )}

        {step === 'result' && analysis && (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="text-5xl">{analysis.categoryIcon}</span>
                <div>
                  <p className="text-sm font-medium uppercase tracking-wide text-emerald-600">
                    Catégorie détectée
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900">{analysis.categoryLabel}</h3>
                  <p className="mt-1 text-slate-600">{analysis.categoryHint}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {weightPreview && (
                  <img src={weightPreview} alt="Balance" className="h-28 rounded-xl object-cover" />
                )}
                {productPreview && (
                  <img src={productPreview} alt="Marchandise" className="h-28 rounded-xl object-cover" />
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Poids estimé</p>
              <div className="mt-3 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => adjustWeight(-0.5)}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold hover:bg-slate-200"
                  aria-label="Diminuer le poids"
                >
                  <Minus className="h-6 w-6" />
                </button>
                <div className="text-center">
                  <p className="text-4xl font-bold text-slate-900">{weight} kg</p>
                  <p className="text-xs text-slate-500">
                    Confiance {Math.round(analysis.weightConfidence * 100)}% — ajustez si besoin
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => adjustWeight(0.5)}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold hover:bg-slate-200"
                  aria-label="Augmenter le poids"
                >
                  <Plus className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-600 p-6 text-white shadow-lg">
              <p className="text-sm font-medium text-emerald-100">Tarif livraison estimé (Lomé)</p>
              <p className="mt-1 text-4xl font-bold">{formatFcfa(analysis.estimatedPrice)}</p>
              <p className="mt-2 text-sm text-emerald-100">
                ~{analysis.estimatedMinutes} min · {analysis.distanceKm.toFixed(1)} km · tarif kikchee
              </p>
            </div>

            <p className="text-center text-sm text-slate-600">{analysis.message}</p>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 py-5 text-xl font-bold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <CheckCircle2 className="h-7 w-7" />
              )}
              {loading ? 'Création…' : 'Valider le colis'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('intro');
                setAnalysis(null);
                setWeightFile(null);
                setProductFile(null);
                setWeightPreview(null);
                setProductPreview(null);
              }}
              className="w-full text-center text-sm text-slate-500 hover:text-emerald-700"
            >
              Recommencer avec de nouvelles photos
            </button>
          </div>
        )}

        <div className="mt-10 border-t pt-6">
          <button
            type="button"
            onClick={() => setShowManual(!showManual)}
            className="flex w-full items-center justify-between text-sm text-slate-500 hover:text-slate-700"
          >
            <span>Mode manuel (avancé)</span>
            {showManual ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showManual && (
            <form onSubmit={handleManualSubmit} className="mt-4 space-y-4 rounded-xl border bg-white p-4">
              <p className="text-xs text-slate-500">
                Réservé si vous préférez saisir vous-même (poids minimum requis).
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium">Poids (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={manualForm.weight}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, weight: parseFloat(e.target.value) })
                  }
                  className="w-full rounded-lg border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Note (optionnel)</label>
                <textarea
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2"
                  rows={2}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Créer en mode manuel
              </button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
