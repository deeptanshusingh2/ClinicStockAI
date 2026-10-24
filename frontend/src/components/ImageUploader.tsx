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
  HelpCircle
} from 'lucide-react';
import { SampleImage } from '../types';
import { api } from '../api/client';

interface ImageUploaderProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (result: any) => void;
  onError: (msg: string) => void;
  isAnalyzing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onAnalysisStart,
  onAnalysisComplete,
  onError,
  isAnalyzing,
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
      {/* Top Banner / Core Principle Reminder */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Visual Shelf Inventory Audit</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Scan clear or challenging shelf photos. AI drafts structured records with uncertainty flags; authorized staff verify all stock.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4 text-teal-400" />
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
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Test Benchmark Scenarios</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                1-Click Preset
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
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
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'bg-teal-950/40 border-teal-500/50 shadow-sm shadow-teal-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 shrink-0 relative">
                      <img
                        src={sample.url}
                        alt={sample.title}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-semibold truncate ${isSelected ? 'text-teal-300' : 'text-slate-200'}`}>
                        {sample.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {sample.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sample.features.slice(0, 2).map((feat, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50"
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
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <HelpCircle className="w-4 h-4 text-teal-400" />
              <span>VisionStock Audit Rules</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
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
            className={`relative flex-1 min-h-[360px] rounded-2xl border-2 transition-all flex flex-col items-center justify-center overflow-hidden ${
              dragActive
                ? 'border-teal-500 bg-teal-950/20'
                : previewUrl
                ? 'border-slate-800 bg-slate-950'
                : 'border-dashed border-slate-700 bg-slate-900/20 hover:border-slate-600'
            }`}
          >
            {previewUrl ? (
              <div className="relative w-full h-full min-h-[360px] flex items-center justify-center p-3">
                <img
                  src={previewUrl}
                  alt="Shelf Preview"
                  className="max-h-[380px] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
                />

                {/* Laser Scanning Animation Overlay */}
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 transition-all">
                    {/* Glowing scanning bar */}
                    <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_#2dd4bf] animate-scanner-line" />

                    <div className="bg-slate-900/90 border border-teal-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-teal-500/10 text-center space-y-4">
                      <div className="inline-flex p-3 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 animate-spin">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Visual Audit In Progress</h4>
                        <p className="text-xs text-teal-300 font-mono mt-1">
                          {scanStepsText[scanStep]}
                        </p>
                      </div>

                      {/* Step Progress Dots */}
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {[0, 1, 2, 3].map((s) => (
                          <div
                            key={s}
                            className={`h-1.5 rounded-full transition-all ${
                              s <= scanStep ? 'w-8 bg-teal-400' : 'w-2 bg-slate-700'
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
                    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-900/90 text-slate-300 border border-slate-700 shadow-md">
                      {selectedFile ? selectedFile.name : selectedSample?.title}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setSelectedSample(null);
                        setPreviewUrl(null);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 shadow-md transition"
                      title="Clear photo"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-8 space-y-3">
                <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center border border-slate-700">
                  <UploadCloud className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Drop a medicine shelf photo here, or browse
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Accepts JPG, PNG, WEBP up to 8 MB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 rounded-lg border border-teal-500/30 transition"
                >
                  Select Photo File
                </button>
              </div>
            )}
          </div>

          {/* Action Trigger Bar */}
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span>{previewUrl ? 'Ready for vision inference' : 'Awaiting shelf image'}</span>
            </div>

            <button
              id="btn-analyze-shelf"
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || !previewUrl}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 shadow-lg ${
                isAnalyzing || !previewUrl
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.01]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Auditing Shelf...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
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
