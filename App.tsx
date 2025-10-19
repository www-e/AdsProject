import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { HistoryItem } from './types';
import { Step } from './types';
import { enhanceAndCleanImage, createCgiAd, generateVideoPrompt, generateRandomScene } from './services/geminiService';
import { getHistory, addToHistory, saveHistory, clearHistory, NewHistoryItemData } from './history';

// --- Helper: File to Base64 ---
const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
            const data = result.split(',')[1];
            resolve({ data, mimeType });
        };
        reader.onerror = (error) => reject(error);
    });
};

// --- Icon Components ---
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25z" /></svg>
);
const MagicIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.553L16.5 21.75l-.398-1.197a3.375 3.375 0 00-2.456-2.456L12.75 18l1.197-.398a3.375 3.375 0 002.456-2.456L16.5 14.25l.398 1.197a3.375 3.375 0 002.456 2.456L20.25 18l-1.197.398a3.375 3.375 0 00-2.456 2.456z" /></svg>
);
const DesignIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.4-c.364.463-.7.996-1.027 1.511a6 6 0 0011.94 0c-.327-.515-.663-1.048-1.027-1.511a2.25 2.25 0 01-2.4-2.4 3 3 0 00-5.78-1.128zM15 5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
);
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
);
const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></svg>
);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.144-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.057-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
);


// --- UI Components ---
const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
    <div className="absolute inset-0 bg-[rgba(var(--color-background),0.8)] backdrop-blur-sm flex flex-col items-center justify-center z-50">
        <div className="w-16 h-16 border-4 border-t-[rgb(var(--color-primary))] border-r-[rgb(var(--color-primary))] border-b-[rgb(var(--color-primary))] border-slate-700 rounded-full animate-spin"></div>
        <p className="text-white text-xl mt-4 tracking-wider">{message}</p>
    </div>
);

const CustomButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; disabled?: boolean; variant?: 'primary' | 'secondary' | 'danger' }> = ({ onClick, children, className = '', disabled = false, variant = 'primary' }) => {
    const baseClasses = "px-6 py-3 font-semibold rounded-lg shadow-md transition-all duration-300 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--color-background))]";
    const variantClasses = {
        primary: "bg-[rgb(var(--color-primary-dark))] text-white hover:bg-[rgb(var(--color-primary-darker))] focus:ring-[rgb(var(--color-primary))] disabled:bg-[rgb(var(--color-disabled))] disabled:cursor-not-allowed",
        secondary: "bg-[rgb(var(--color-secondary))] text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-secondary-hover))] focus:ring-slate-500 disabled:bg-[rgb(var(--color-disabled-surface))] disabled:text-[rgb(var(--color-disabled-text))]",
        danger: "bg-[rgb(var(--color-error))] text-white hover:bg-red-600 focus:ring-red-500",
    };

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
            {children}
        </button>
    );
};

const ImageUploader: React.FC<{ onUpload: (file: File) => void }> = ({ onUpload }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };
    const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUpload(e.dataTransfer.files[0]);
        }
    }
    const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => e.preventDefault();

    return (
        <label onDrop={onDrop} onDragOver={onDragOver} className="w-full h-64 border-2 border-dashed border-[rgb(var(--color-border))] rounded-xl flex flex-col items-center justify-center text-[rgb(var(--color-text-muted))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-light))] transition-all duration-300 cursor-pointer bg-[rgba(var(--color-surface),0.5)]">
            <UploadIcon className="w-16 h-16 mb-4" />
            <span className="text-lg font-medium">Drag & Drop or Click to Upload</span>
            <span className="text-sm">PNG, JPG, WEBP supported</span>
            <p className="text-xs text-[rgb(var(--color-text-subtle))] mt-2">For best results, use a clear and well-lit image.</p>
            <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
        </label>
    );
};

// --- Step Components ---

const StepIndicator: React.FC<{ currentStep: Step }> = ({ currentStep }) => {
    const steps = useMemo(() => [
        { id: Step.PREPARE, label: 'Prepare', icon: <MagicIcon className="w-6 h-6" /> },
        { id: Step.DESIGN, label: 'Design', icon: <DesignIcon className="w-6 h-6" /> },
        { id: Step.FINALIZE, label: 'Finalize', icon: <CheckIcon className="w-6 h-6" /> },
    ], []);

    const currentStepIndex = useMemo(() => steps.findIndex(s => s.id === currentStep), [steps, currentStep]);

    return (
        <nav className="flex items-center justify-center p-4" aria-label="Progress">
            <ol role="list" className="flex items-center space-x-2 md:space-x-8">
                {steps.map((step, index) => (
                    <li key={step.label} className="relative">
                        <div className="flex items-center text-sm font-medium">
                            <span className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors duration-300 ${index <= currentStepIndex ? 'bg-[rgb(var(--color-primary-dark))] text-white' : 'bg-[rgb(var(--color-secondary))] text-[rgb(var(--color-text-muted))]'}`}>
                                {step.icon}
                            </span>
                            <span className={`hidden md:inline-block ml-4 ${index <= currentStepIndex ? 'text-white' : 'text-[rgb(var(--color-text-muted))]'}`}>{step.label}</span>
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`absolute top-1/2 left-full w-4 md:w-12 h-0.5 -translate-y-1/2 transition-colors duration-300 ${index < currentStepIndex ? 'bg-[rgb(var(--color-primary-dark))]' : 'bg-[rgb(var(--color-secondary))]'}`} />
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
};


const PrepareStep: React.FC<{ originalImage: { url: string; } | null; preparedImage: { url: string; } | null; onPrepare: () => void; onNext: () => void; onUpload: (file: File) => void; hasPrepared: boolean; }> = ({ originalImage, preparedImage, onPrepare, onNext, onUpload, hasPrepared }) => {
    if (!originalImage) {
        return (
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-8">
                <h2 className="text-3xl font-bold text-white mb-2">Upload Your Product Image</h2>
                <p className="text-[rgb(var(--color-text-muted))] mb-8 text-center">Start by uploading a high-quality image of your product. If it's already background-free, you can skip the preparation step.</p>
                <ImageUploader onUpload={onUpload} />
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center p-8">
            <h2 className="text-3xl font-bold text-white mb-2">Prepare Your Product</h2>
            <p className="text-[rgb(var(--color-text-muted))] mb-8 text-center max-w-2xl">Our AI will remove the background to prepare your product for the CGI scene. If your image is ready, just click 'Next Step'.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-8">
                <div className="flex flex-col items-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Before</h3>
                    <div className="w-full h-80 bg-[rgba(var(--color-surface),0.5)] rounded-xl p-4 flex items-center justify-center">
                        <img src={originalImage.url} alt="Original Product" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>
                <div className="flex flex-col items-center">
                    <h3 className="text-xl font-semibold text-white mb-4">After</h3>
                    <div className="w-full h-80 bg-[rgba(var(--color-surface),0.5)] rounded-xl p-4 flex items-center justify-center bg-[url('data:image/svg+xml;charset=utf-8,<svg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%202%202%22%3E<path%20d%3D%22M1%202V0h1v1H0v1z%22%20fill-opacity%3D%22.1%22%2F%3E<%2Fsvg>')]">
                        {preparedImage ? (
                            <img src={preparedImage.url} alt="Prepared Product" className="max-w-full max-h-full object-contain" />
                        ) : (
                            <div className="text-[rgb(var(--color-text-subtle))]">Result will appear here</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                <CustomButton onClick={onPrepare} disabled={hasPrepared} variant="secondary">
                    <MagicIcon className="w-5 h-5" />
                    {hasPrepared ? 'Product Prepared' : 'Prepare Product'}
                </CustomButton>
                <CustomButton onClick={onNext} variant="primary">
                    Next Step
                    <ArrowRightIcon className="w-5 h-5" />
                </CustomButton>
            </div>
        </div>
    );
};

const DesignStep: React.FC<{
    productImage: { url: string };
    scene: string;
    setScene: (scene: string) => void;
    onDesign: (aspect: string) => void;
    onGenerateRandomScene: () => void;
    onBack: () => void;
}> = ({ productImage, scene, setScene, onDesign, onGenerateRandomScene, onBack }) => {
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [inputMode, setInputMode] = useState<'manual' | 'ideas' | 'random'>('manual');

    const dimensions = [
        { label: 'Square (1:1) - General Social Post', value: '1:1' },
        { label: 'Portrait (9:16) - Stories & Reels', value: '9:16' },
        { label: 'Landscape (16:9) - Video & X/Twitter', value: '16:9' },
        { label: 'Vertical (4:5) - Instagram/Facebook Feed', value: '4:5' },
        { label: 'Pinterest (2:3)', value: '2:3' },
    ];

    const creativeConcepts = [
        { title: "Deconstructed Delight", description: "A visually stunning flat-lay of your food product, deconstructed into its core ingredients (like floating chocolate chips, a swirl of caramel, fresh berries) arranged beautifully on a rustic wooden or marble surface. The lighting is soft and natural." },
        { title: "Zero-Gravity Treat", description: "The dessert and its various toppings (sprinkles, fruit, sauce) float weightlessly in a minimalist, pastel-colored room. A slow-motion camera pan captures the delicious details from every angle, creating a dreamlike, magical effect." },
        { title: "Giant Food in the City", description: "A colossal version of your food or beverage product placed in a bustling, iconic city street. Imagine a giant cookie being dunked into a river, or a skyscraper-sized ice cream cone with melting drips down the side." },
        { title: "Nature's Serving Plate", description: "Your dessert is presented in a breathtaking natural setting. Imagine an ice cream scoop nestled in a blooming lotus flower on a serene pond, or a slice of cake resting on a moss-covered rock in an enchanted forest." },
        { title: "Stop-Motion Creation", description: "A playful and vibrant scene showing your dessert being magically assembled piece-by-piece in a stop-motion style. Ingredients dance and jump into place on a colorful, patterned background, ending with the perfect final product." },
        { title: "Flavor Explosion", description: "An extreme close-up, slow-motion shot of the dessert being cracked open or bitten into, causing a beautiful explosion of fillings, powders, or liquid centers. The background is dark and moody to make the colors of the ingredients pop." },
        { title: "Dessert Drip Symphony", description: "A mesmerizing shot focusing on rich, glossy sauces (chocolate, caramel, berry coulis) being drizzled over the dessert in slow motion. The camera follows the drip as it elegantly coats the surface, emphasizing texture and indulgence." },
    ];

    const handleSubmit = () => { if (scene.trim()) { onDesign(aspectRatio); } };

    const ModeButton: React.FC<{ label: string, mode: 'manual' | 'ideas' | 'random' }> = ({ label, mode }) => (
        <button onClick={() => setInputMode(mode)} className={`w-full text-center px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none ${inputMode === mode ? 'bg-[rgb(var(--color-primary-dark))] text-white' : 'bg-transparent text-[rgb(var(--color-text-primary))] hover:bg-[rgb(var(--color-secondary))]'}`}>
            {label}
        </button>
    );

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center p-8">
            <h2 className="text-3xl font-bold text-white mb-2">Design Your CGI Ad</h2>
            <p className="text-[rgb(var(--color-text-muted))] mb-8 text-center max-w-2xl">Now for the creative part! Describe the environment for your product. Be as detailed as you like, or use our idea generators to get started.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mb-8">
                <div className="md:col-span-1 flex flex-col items-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Your Product</h3>
                    <div className="w-full h-80 bg-[rgba(var(--color-surface),0.5)] rounded-xl p-4 flex items-center justify-center bg-[url('data:image/svg+xml;charset=utf-8,<svg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%202%202%22%3E<path%20d%3D%22M1%202V0h1v1H0v1z%22%20fill-opacity%3D%22.1%22%2F%3E<%2Fsvg>')]">
                        <img src={productImage.url} alt="Prepared Product" className="max-w-full max-h-full object-contain" />
                    </div>
                </div>
                <div className="md:col-span-2 flex flex-col">
                    <label htmlFor="scene" className="text-xl font-semibold text-white mb-4">Scene Description</label>
                    <div className="flex space-x-1 mb-3 p-1 bg-[rgb(var(--color-surface))] rounded-lg border border-[rgb(var(--color-secondary))]">
                        <ModeButton label="Write Manually" mode="manual" />
                        <ModeButton label="Creative Concepts" mode="ideas" />
                        <ModeButton label="Generate Randomly" mode="random" />
                    </div>
                    <div className="flex-grow flex flex-col">
                        <textarea id="scene" value={scene} onChange={(e) => setScene(e.target.value)} placeholder={inputMode === 'manual' ? "e.g., On a marble podium floating in a galaxy..." : inputMode === 'ideas' ? "Click a concept below to use its description." : "Click 'Spark Creativity' to generate an idea here."} className="w-full flex-grow bg-[rgba(var(--color-surface),0.5)] border border-[rgb(var(--color-border))] rounded-lg p-4 text-white placeholder-[rgb(var(--color-text-subtle))] focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] transition-colors" rows={inputMode === 'ideas' ? 4 : 8} />
                        {inputMode === 'ideas' && (
                            <div className="mt-2 space-y-2 h-48 overflow-y-auto pr-2">
                                {creativeConcepts.map((concept) => (
                                    <button key={concept.title} onClick={() => setScene(concept.description)} className="w-full text-left p-3 bg-[rgba(var(--color-secondary),0.5)] rounded-md hover:bg-[rgb(var(--color-secondary))] transition-colors text-[rgb(var(--color-text-muted))]">
                                        <h4 className="font-semibold text-white">{concept.title}</h4>
                                        <p className="text-sm text-[rgb(var(--color-text-muted))]">{concept.description}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                        {inputMode === 'random' && (<div className="mt-3 flex justify-center"> <CustomButton onClick={onGenerateRandomScene} variant="secondary"> Spark Creativity ✨ </CustomButton> </div>)}
                    </div>
                    <h3 className="text-xl font-semibold text-white mt-6 mb-4">Ad Dimensions</h3>
                    <div className="relative w-full">
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="w-full bg-[rgba(var(--color-surface),0.5)] border border-[rgb(var(--color-border))] rounded-lg p-4 pr-10 text-white focus:ring-2 focus:ring-[rgb(var(--color-primary))] focus:border-[rgb(var(--color-primary))] transition-colors appearance-none cursor-pointer"
                        >
                            {dimensions.map(dim => (
                                <option key={dim.value} value={dim.value} className="bg-[rgb(var(--color-surface))] text-white">
                                    {dim.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[rgb(var(--color-text-muted))]">
                            <ChevronDownIcon className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex gap-4">
                <CustomButton onClick={onBack} variant="secondary">Back</CustomButton>
                <CustomButton onClick={handleSubmit} disabled={!scene.trim()}>
                    <DesignIcon className="w-5 h-5" />
                    Generate Ad
                </CustomButton>
            </div>
        </div>
    );
};

const FinalizeStep: React.FC<{ adImage: { url: string }; videoPrompt: string | null; onGeneratePrompt: () => void; onStartOver: () => void; onRedesignFromPrepared: () => void; onRedesignFromFinal: () => void; }> = ({ adImage, videoPrompt, onGeneratePrompt, onStartOver, onRedesignFromPrepared, onRedesignFromFinal }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (videoPrompt) {
            navigator.clipboard.writeText(videoPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center p-8">
            <h2 className="text-3xl font-bold text-white mb-2">Your CGI Ad is Ready!</h2>
            <p className="text-[rgb(var(--color-text-muted))] mb-8 text-center max-w-2xl">Excellent! Here's your final CGI ad. We've also created a text prompt you can use with AI video tools (like Veo, Sora, etc.) to animate your new ad.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-8">
                <div className="flex flex-col items-center">
                    <h3 className="text-xl font-semibold text-white mb-4">Generated Ad</h3>
                    <div className="w-full aspect-auto bg-[rgba(var(--color-surface),0.5)] rounded-xl p-2 flex items-center justify-center">
                        <img src={adImage.url} alt="Generated CGI Ad" className="max-w-full max-h-full object-contain rounded-lg" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <h3 className="text-xl font-semibold text-white mb-4">Video Animation Prompt</h3>
                    <div className="w-full flex-grow bg-[rgba(var(--color-surface),0.5)] border border-[rgb(var(--color-border))] rounded-lg p-4 text-[rgb(var(--color-text-muted))] relative">
                        {videoPrompt ? (
                            <>
                                <p>{videoPrompt}</p>
                                <button onClick={handleCopy} className="absolute top-2 right-2 p-2 rounded-md bg-[rgb(var(--color-secondary))] hover:bg-[rgb(var(--color-secondary-hover))] text-[rgb(var(--color-text-muted))] transition-colors">
                                    {copied ? <CheckIcon className="w-5 h-5 text-[rgb(var(--color-success))]" /> : <CopyIcon className="w-5 h-5" />}
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="text-[rgb(var(--color-text-muted))] mb-4">Click the button to generate a descriptive prompt for AI video tools!</p>
                                <CustomButton onClick={onGeneratePrompt} variant="secondary">
                                    Generate Video Prompt
                                </CustomButton>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
                <CustomButton onClick={onRedesignFromPrepared} variant="secondary">Redesign with Product</CustomButton>
                <CustomButton onClick={onRedesignFromFinal} variant="secondary">Iterate on this Ad</CustomButton>
                <CustomButton onClick={onStartOver} variant="primary">Start Over</CustomButton>
            </div>
        </div>
    );
};

const HistoryView: React.FC<{ history: HistoryItem[], onSelectItem: (item: HistoryItem) => void, onClearHistory: () => void }> = ({ history, onSelectItem, onClearHistory }) => {
    if (history.length === 0) {
        return (
            <div className="text-center py-16">
                <h2 className="text-3xl font-bold text-white mb-2">No Ads in History</h2>
                <p className="text-[rgb(var(--color-text-muted))]">Your generated ads will appear here once you create them.</p>
            </div>
        )
    }
    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-white text-center">Project History</h2>
                <CustomButton onClick={onClearHistory} variant="danger">
                    <TrashIcon className="w-5 h-5" />
                    Clear All History
                </CustomButton>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {history.map(item => (
                    <button key={item.id} onClick={() => onSelectItem(item)} className="block group rounded-lg overflow-hidden bg-[rgba(var(--color-surface),0.5)] border border-[rgb(var(--color-secondary))] hover:border-[rgb(var(--color-primary))] transition-all duration-300 shadow-lg">
                        <div className="aspect-square overflow-hidden">
                            <img src={item.finalAd.url} alt="Generated Ad Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                        <div className="p-4 text-left">
                            <p className="text-sm text-[rgb(var(--color-text-muted))]">{new Date(item.timestamp).toLocaleString()}</p>
                            <p className="text-white font-semibold truncate mt-1">{item.sceneDescription}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

const HistoryDetailModal: React.FC<{ item: HistoryItem, onClose: () => void }> = ({ item, onClose }) => {
    return (
        <div className="fixed inset-0 bg-[rgba(var(--color-background),0.8)] backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[rgb(var(--color-surface))] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col relative border border-[rgb(var(--color-secondary))]" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 p-2 text-[rgb(var(--color-text-muted))] hover:text-white transition-colors rounded-full bg-[rgba(var(--color-background),0.5)] z-10"><CloseIcon className="w-6 h-6" /></button>
                <div className="grid md:grid-cols-2 gap-6 p-6 overflow-y-auto">
                    <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Generated Ad</h3>
                        <img src={item.finalAd.url} alt="Generated Ad" className="rounded-lg w-full object-contain" />
                    </div>
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-2">Scene Description</h3>
                            <p className="bg-[rgba(var(--color-background),0.5)] p-3 rounded-md text-[rgb(var(--color-text-muted))]">{item.sceneDescription}</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-2">Video Animation Prompt</h3>
                            <p className="bg-[rgba(var(--color-background),0.5)] p-3 rounded-md text-[rgb(var(--color-text-muted))]">{item.videoPrompt || 'Not generated.'}</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-2">Created</h3>
                            <p className="bg-[rgba(var(--color-background),0.5)] p-3 rounded-md text-[rgb(var(--color-text-muted))]">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [step, setStep] = useState<Step>(Step.PREPARE);
    const [originalImage, setOriginalImage] = useState<{ file: File; url: string; mimeType: string; data: string } | null>(null);
    const [preparedImage, setPreparedImage] = useState<{ url: string; mimeType: string; data: string } | null>(null);
    const [finalAd, setFinalAd] = useState<{ url: string; mimeType: string; data: string; id: string } | null>(null);
    const [videoPrompt, setVideoPrompt] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [scene, setScene] = useState('');
    const [view, setView] = useState<'studio' | 'history'>('studio');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
    const [hasPrepared, setHasPrepared] = useState(false);

    useEffect(() => { setHistory(getHistory()); }, []);

    const sceneDescriptionRef = useRef('');

    const handleUpload = useCallback(async (file: File) => {
        setError(null);
        try {
            const { data, mimeType } = await fileToBase64(file);
            const url = URL.createObjectURL(file);
            setOriginalImage({ file, url, mimeType, data });
            setPreparedImage({ url, data, mimeType }); // By default, prepared image is same as original
            setHasPrepared(false); // Reset preparation status on new upload
        } catch (err) {
            console.error(err);
            setError("Failed to read the image file.");
        }
    }, []);

    const handlePrepare = useCallback(async () => {
        if (!originalImage) return;
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Preparing product...');
        try {
            const preparedData = await enhanceAndCleanImage(originalImage.data, originalImage.mimeType);
            const mimeType = 'image/png';
            const url = `data:${mimeType};base64,${preparedData}`;
            setPreparedImage({ url, data: preparedData, mimeType });
            setHasPrepared(true);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during preparation.");
        } finally {
            setIsLoading(false);
        }
    }, [originalImage]);

    const handleDesign = useCallback(async (aspect: string) => {
        if (!preparedImage || !scene.trim()) return;
        sceneDescriptionRef.current = scene;
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Designing CGI Ad...');
        try {
            const adData = await createCgiAd(preparedImage.data, preparedImage.mimeType, scene, aspect);
            const mimeType = 'image/jpeg';
            const url = `data:${mimeType};base64,${adData}`;

            const newHistoryItem: NewHistoryItemData = {
                finalAd: { url },
                sceneDescription: scene,
                videoPrompt: '' // Initially empty
            };
            const newHistory = addToHistory(newHistoryItem);
            setHistory(newHistory);

            setFinalAd({ url, data: adData, mimeType, id: newHistory[0].id });
            setStep(Step.FINALIZE);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred during ad design.");
        } finally {
            setIsLoading(false);
        }
    }, [preparedImage, scene]);

    const handleGeneratePrompt = useCallback(async () => {
        if (!finalAd) return;
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Writing video prompt...');
        try {
            const prompt = await generateVideoPrompt(finalAd.data, finalAd.mimeType, sceneDescriptionRef.current);
            setVideoPrompt(prompt);

            const updatedHistory = history.map(item =>
                item.id === finalAd.id ? { ...item, videoPrompt: prompt } : item
            );
            setHistory(updatedHistory);
            saveHistory(updatedHistory);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred generating the prompt.");
        } finally {
            setIsLoading(false);
        }
    }, [finalAd, history]);

    const handleGenerateRandomScene = useCallback(async () => {
        if (!preparedImage) return;
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Brainstorming ideas...');
        try {
            const randomScene = await generateRandomScene(preparedImage.data, preparedImage.mimeType);
            setScene(randomScene.trim());
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unknown error occurred while generating a scene.");
        } finally {
            setIsLoading(false);
        }
    }, [preparedImage]);


    const handleStartOver = () => {
        setStep(Step.PREPARE);
        setOriginalImage(null);
        setPreparedImage(null);
        setFinalAd(null);
        setVideoPrompt(null);
        setError(null);
        setScene('');
        sceneDescriptionRef.current = '';
        setView('studio');
        setHasPrepared(false);
    };

    const handleRedesignFromPrepared = () => {
        setStep(Step.DESIGN);
        setFinalAd(null);
        setVideoPrompt(null);
    };

    const handleRedesignFromFinal = () => {
        if (!finalAd) return;
        setPreparedImage({ url: finalAd.url, data: finalAd.data, mimeType: finalAd.mimeType });
        setStep(Step.DESIGN);
        setFinalAd(null);
        setVideoPrompt(null);
        setHasPrepared(true); // Since we are using a final ad, it is considered "prepared"
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to delete all your project history? This action cannot be undone.")) {
            clearHistory();
            setHistory([]);
        }
    };

    const renderStudio = () => {
        switch (step) {
            case Step.PREPARE:
                return <PrepareStep originalImage={originalImage} preparedImage={preparedImage} onPrepare={handlePrepare} onNext={() => setStep(Step.DESIGN)} onUpload={handleUpload} hasPrepared={hasPrepared} />;
            case Step.DESIGN:
                return preparedImage && <DesignStep productImage={preparedImage} scene={scene} setScene={setScene} onDesign={handleDesign} onGenerateRandomScene={handleGenerateRandomScene} onBack={() => setStep(Step.PREPARE)} />;
            case Step.FINALIZE:
                return finalAd && <FinalizeStep adImage={finalAd} videoPrompt={videoPrompt} onGeneratePrompt={handleGeneratePrompt} onStartOver={handleStartOver} onRedesignFromPrepared={handleRedesignFromPrepared} onRedesignFromFinal={handleRedesignFromFinal} />;
            default:
                return <PrepareStep originalImage={originalImage} preparedImage={preparedImage} onPrepare={handlePrepare} onNext={() => setStep(Step.DESIGN)} onUpload={handleUpload} hasPrepared={hasPrepared} />;
        }
    };

    const NavButton = ({ currentView, targetView, setView, children }: { currentView: string, targetView: string, setView: (v: 'studio' | 'history') => void, children: React.ReactNode }) => (
        <button onClick={() => setView(targetView as 'studio' | 'history')} className={`px-4 py-2 rounded-md font-semibold transition-colors ${currentView === targetView ? 'bg-[rgb(var(--color-primary-dark))] text-white' : 'bg-[rgb(var(--color-secondary))] text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-secondary-hover))]'}`}>
            {children}
        </button>
    );

    return (
        <div className="min-h-screen">
            <div className="relative container mx-auto px-4 py-8 flex flex-col min-h-screen">
                <header className="text-center mb-8">
                    <div className="absolute top-4 right-4 z-10">
                        <div className="flex space-x-2 bg-[rgb(var(--color-surface))] p-1 rounded-lg border border-[rgb(var(--color-secondary))]">
                            <NavButton currentView={view} targetView="studio" setView={setView}>Studio</NavButton>
                            <NavButton currentView={view} targetView="history" setView={setView}>History</NavButton>
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-[rgb(var(--color-purple-light))] to-[rgb(var(--color-pink))] text-transparent bg-clip-text">
                        AI CGI Ad Studio
                    </h1>
                    <p className="text-[rgb(var(--color-text-muted))] mt-2 max-w-2xl mx-auto">Transform your product photos into viral, cinematic CGI advertisements in minutes.</p>
                </header>
                <main className="flex-grow flex flex-col items-center justify-center">
                    <div className="w-full bg-[rgba(var(--color-surface),0.3)] rounded-2xl shadow-2xl shadow-black/20 border border-[rgb(var(--color-secondary))]">
                        {view === 'studio' && <StepIndicator currentStep={step} />}

                        {error && (
                            <div className="bg-[rgba(var(--color-error),0.2)] border border-[rgb(var(--color-error))] text-[rgb(var(--color-error))] p-4 rounded-lg m-6 text-center">
                                <strong>Error:</strong> {error}
                            </div>
                        )}

                        {view === 'studio' ? renderStudio() : <HistoryView history={history} onSelectItem={setSelectedHistoryItem} onClearHistory={handleClearHistory} />}
                    </div>
                </main>
                {isLoading && <LoadingOverlay message={loadingMessage} />}
                {selectedHistoryItem && <HistoryDetailModal item={selectedHistoryItem} onClose={() => setSelectedHistoryItem(null)} />}
                <footer className="bg-gradient-to-b from-neutral-900 to-black text-center text-gray-300 py-8 mt-12 rounded-t-xl">
                    <p className="text-lg font-medium mb-2">
                        Powered by <span className="text-white">Google Gemini</span>
                    </p>

                    <p className="text-sm mb-6">
                        Made with ❤️ in Egypt by{' '}
                        <a
                            href="https://yourportfolio.link"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-blue-400 transition-colors font-semibold"
                        >
                            Omar Ashraf
                        </a>{' '}
                        — Reach me at <a href="tel:01154688628" className="hover:underline">01154688628</a>
                    </p>

                    <div className="flex justify-center gap-4">
                        <a
                            href="https://omar-flax.vercel.app/"
                            className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 transition-all shadow-md"
                        >
                            Let’s Work Together
                        </a>
                        <a
                            href="https://www.linkedin.com/in/omar-ashraf-176790262/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2 border border-gray-500 rounded-full hover:bg-gray-800 transition-all"
                        >
                            LinkedIn
                        </a>
                    </div>

                    <p className="text-xs text-gray-500 mt-6">
                        Thanks to Ahmed Elgohary for the inspiration ✨
                    </p>
                </footer>

            </div>
        </div>
    );
}