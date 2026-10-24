import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Eye,
  Camera,
  Layers,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { SampleImage, OllamaStatus } from '../types';
import { api } from '../api/client';

interface ImageUploaderProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: any) => void;
  onError: (msg: string) => void;
  isAnalyzing: boolean;
  ollamaStatus?: OllamaStatus | null;
  onTestConnection?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onAnalysisStart,
  onAnalysisComplete,
  onError,
  isAnalyzing,
  ollamaStatus,
  onTestConnection,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSample, setSelectedSample] = useState<SampleImage | null>(null);
  const [samples, setSamples] = useState<SampleImage[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [scanStep, setScanStep] = useState<number>(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample images on mount
  useEffect(() => {
    api.getSampleImages()
      .then(data => {
        setSamples(data);
        // Default to Shelf A for instant demo readiness
        if (data.length > 0 && !selectedFile && !selectedSample) {
          setSelectedSample(data[0]);
          setPreviewUrl(data[0].url);
        }
      })
      .catch(() => {});
  }, []);

  // Scanning stages timer
  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setScanStep(0);
      interval = setInterval(() => {
        setScanStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 700);
    } else {
      setScanStep(0);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validExtensions.includes(file.type)) {
      onError('Unsupported file format. Please upload JPG, PNG, or WEBP images.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      onError('File size exceeds the 8 MB maximum limit for VisionStock MVP.');
      return;
    }

    setSelectedFile(file);
    setSelectedSample(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleSelectSample = (sample: SampleImage) => {
    setSelectedSample(sample);
    setSelectedFile(null);
    setPreviewUrl(sample.url);
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile && !selectedSample) {
      onError('Please upload a shelf photo or select a sample shelf image.');
      return;
    }

    if (selectedFile && ollamaStatus && !ollamaStatus.connected) {
      onError(`Ollama is disconnected: ${ollamaStatus.message || 'Server unreachable at http://127.0.0.1:11434'}. Please run 'ollama serve' or click Test Connection above.`);
      return;
    }

    try {
      onAnalysisStart();
      let result;
      if (selectedFile) {
        result = await api.analyzeShelf(selectedFile, undefined);
      } else if (selectedSample) {
        result = await api.analyzeShelf(undefined, selectedSample.id);
      }
      onAnalysisComplete(result);
    } catch (err: any) {
      onError(err.message || 'Analysis failed. Please try again.');
    }
  };

  const scanStepsText = [
    'Validating image resolution & shelf lighting...',
    'Segmenting visible pharmaceutical packages...',
    'Extracting medicine names, strength & batch embossing...',
    'Evaluating expiry legibility & flagging uncertainty...'
  ];

  return (
    <div className="space-y-6">
      {/* Disconnection Alert Banner if Ollama is unreachable */}
      {ollamaStatus && !ollamaStatus.connected && (
        <div className="bg-[#fbeeed] border border-[#f5c6c5] rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#a32220] shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#c23330] shrink-0" />
            <div>
              <p className="font-bold text-[#8d1d1b]">Ollama API Disconnected</p>
              <p className="text-stone-600 mt-0.5">
                {ollamaStatus.message || 'Ollama is unreachable at http://127.0.0.1:11434'}. Custom photo analysis requires Ollama running with Gemma 4.
              </p>
            </div>
          </div>
          {onTestConnection && (
            <button
              onClick={onTestConnection}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-[#8d1d1b] border border-[#e5a8a6] text-xs font-bold shrink-0 cursor-pointer shadow-sm transition"
            >
              Test Connection
            </button>
          )}
        </div>
      )}

      {/* Top Banner / Core Principle Reminder */}
      <div className="bg-white border border-stone-200/70 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-[#edf4ea] text-[#3e5e32] border border-[#d6e7ce] shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-stone-900 tracking-tight">
              Visual Shelf Inventory Audit
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Scan clear or challenging shelf photos. AI drafts structured records with uncertainty flags; authorized staff verify all stock.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition flex items-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-[#476c38]" />
            <span>Upload Custom Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Main Grid: Upload & Preview Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sample Shelf Selector & Guidelines */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-stone-200/70 rounded-3xl p-5 shadow-[0_4px_24px_rgba(30,50,20,0.04)]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#476c38]" />
                <span>Test Benchmark Scenarios</span>
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#edf4ea] text-[#345129]">
                1-Click Preset
              </span>
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Select a pre-annotated test shelf to inspect how VisionStock isolates clean labels versus glaring unreadable dates.
            </p>

            <div className="space-y-2.5">
              {samples.map((sample) => {
                const isSelected = selectedSample?.id === sample.id;
                return (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    disabled={isAnalyzing}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#f0f6ec] border-[#4e7140] shadow-sm'
                        : 'bg-stone-50/60 border-stone-200/80 hover:bg-stone-100'
                    }`}
                  >
                    <div className="w-16 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative">
                      <img
                        src={sample.url}
                        alt={sample.title}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#4e7140]/25 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-[#26441b]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-[#26441b]' : 'text-stone-800'}`}>
                        {sample.title}
                      </h4>
                      <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                        {sample.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sample.features.slice(0, 2).map((feat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-stone-600 border border-stone-200/70"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verification Protocol Callout */}
          <div className="bg-[#edf4ea] border border-[#d3e3cc] rounded-3xl p-5 text-xs text-stone-600 space-y-2">
            <div className="flex items-center gap-2 text-[#2b4b20] font-bold">
              <HelpCircle className="w-4 h-4 text-[#476c38]" />
              <span>VisionStock Audit Rules</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-600">
              <li>Visible package count is an optical estimate, never total inventory.</li>
              <li>Missing or obscured expiry dates are marked null (never hallucinated).</li>
              <li>Unverified drafts are strictly excluded from confirmed totals.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Visual Stage / Drag & Drop Viewer */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative flex-1 min-h-[380px] rounded-3xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden shadow-[0_4px_24px_rgba(30,50,20,0.04)] ${
              dragActive
                ? 'border-[#4e7140] bg-[#eef5eb]'
                : previewUrl
                ? 'border-stone-200 bg-white'
                : 'border-dashed border-stone-300 bg-white hover:border-[#4e7140]'
            }`}
          >
            {previewUrl ? (
              <div className="relative w-full h-full min-h-[380px] flex items-center justify-center p-4">
                <img
                  src={previewUrl}
                  alt="Shelf Preview"
                  className="max-h-[390px] w-auto max-w-full rounded-2xl object-contain shadow-md border border-stone-200"
                />

                {/* Laser Scanning Animation Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 transition-all">
                    {/* Glowing scanning bar */}
                    <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-[#d6f54c] to-transparent shadow-[0_0_15px_#d6f54c] animate-scanner-line" />

                    <div className="bg-white border border-stone-200 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
                      <div className="inline-flex p-3 rounded-full bg-[#edf4ea] text-[#345129] border border-[#d6e7ce] animate-spin">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-stone-900">Visual Audit In Progress</h4>
                        <p className="text-xs text-[#395b2c] font-medium mt-1">
                          {scanStepsText[scanStep]}
                        </p>
                      </div>

                      {/* Step Progress Dots */}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {[0, 1, 2, 3].map((s) => (
                          <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all ${
                              s <= scanStep ? 'w-8 bg-[#496f3c]' : 'w-2 bg-stone-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Clear / Retake pill */}
                {!isAnalyzing && (
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/95 text-stone-800 border border-stone-200 shadow-md">
                      {selectedFile ? selectedFile.name : selectedSample?.title}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setSelectedSample(null);
                        setPreviewUrl(null);
                      }}
                      className="p-1.5 rounded-xl bg-white/95 hover:bg-stone-50 text-stone-500 hover:text-stone-900 border border-stone-200 shadow-md transition cursor-pointer"
                      title="Clear photo"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-[#edf4ea] text-[#395b2c] flex items-center justify-center border border-[#d6e7ce]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-800">
                    Drop a medicine shelf photo here, or browse
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Accepts JPG, PNG, WEBP up to 8 MB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-bold text-[#2a471f] bg-[#edf4ea] hover:bg-[#e0edd9] rounded-xl border border-[#cde0c5] transition cursor-pointer"
                >
                  Select Photo File
                </button>
              </div>
            )}
          </div>

          {/* Action Trigger Bar */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#4e7140]"></span>
              <span>{previewUrl ? 'Ready for vision inference' : 'Awaiting shelf image'}</span>
            </div>

            <button
              id="btn-analyze-shelf"
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || !previewUrl}
              className={`px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                isAnalyzing || !previewUrl
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#e2fa6c] hover:bg-[#d6f254] text-[#1b3419] shadow-sm hover:scale-[1.01]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#1b3419]" />
                  <span>Auditing Shelf...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#1b3419]" />
                  <span>Analyze Shelf with VisionStock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
