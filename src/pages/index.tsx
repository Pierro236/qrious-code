import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ChromePicker } from "react-color";
import { toPng } from "html-to-image";

export default function Home() {
  const [text, setText] = useState("");
  const [qrColor, setQrColor] = useState("#1e40af");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [logo, setLogo] = useState<string | null>(null);
  const [showQrColorPicker, setShowQrColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrColorPickerRef = useRef<HTMLDivElement>(null);
  const bgColorPickerRef = useRef<HTMLDivElement>(null);

  // Fermer les sélecteurs de couleur quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        qrColorPickerRef.current &&
        !qrColorPickerRef.current.contains(event.target as Node)
      ) {
        setShowQrColorPicker(false);
      }
      if (
        bgColorPickerRef.current &&
        !bgColorPickerRef.current.contains(event.target as Node)
      ) {
        setShowBgColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fermer les sélecteurs avec la touche Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowQrColorPicker(false);
        setShowBgColorPicker(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Masquer le message de succès après 3 secondes
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (qrRef.current) {
      setIsLoading(true);
      setShowSuccess(false);

      try {
        const dataUrl = await toPng(qrRef.current);
        const link = document.createElement("a");
        link.download = "qrious-code.png";
        link.href = dataUrl;
        link.click();

        // Afficher le message de succès
        setShowSuccess(true);
      } catch (error) {
        console.error("Erreur lors du téléchargement:", error);
        // Ici on pourrait ajouter un toast d'erreur
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header avec navigation style Qarnot */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Qrious Code</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6 text-sm text-slate-600">
              <span>Générateur de QR codes personnalisés</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section principale */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12">
          {/* Panneau de contrôle */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Personnalisation
                </h2>
              </div>

              <div className="space-y-6">
                {/* Champ texte */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    URL ou message
                  </label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Entrez une URL ou un message..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white"
                    aria-describedby="text-help"
                  />
                  <p id="text-help" className="mt-1 text-xs text-slate-500">
                    Entrez une URL complète (ex: https://example.com) ou un
                    message texte
                  </p>
                </div>

                {/* Couleurs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Couleur du QR code */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Couleur du QR code
                    </label>
                    <div className="relative" ref={qrColorPickerRef}>
                      <button
                        onClick={() => setShowQrColorPicker(!showQrColorPicker)}
                        className="w-full h-12 border border-slate-300 rounded-xl flex items-center justify-between px-4 bg-slate-50 hover:bg-white transition-all duration-200"
                        aria-expanded={showQrColorPicker}
                        aria-haspopup="true"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-6 h-6 rounded-lg border-2 border-white shadow-sm"
                            style={{ backgroundColor: qrColor }}
                          />
                          <span className="text-sm font-mono text-slate-700">
                            {qrColor}
                          </span>
                        </div>
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {showQrColorPicker && (
                        <div className="absolute z-20 mt-2">
                          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                            <ChromePicker
                              color={qrColor}
                              onChange={(color) => setQrColor(color.hex)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Couleur de fond */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Couleur de fond
                    </label>
                    <div className="relative" ref={bgColorPickerRef}>
                      <button
                        onClick={() => setShowBgColorPicker(!showBgColorPicker)}
                        className="w-full h-12 border border-slate-300 rounded-xl flex items-center justify-between px-4 bg-slate-50 hover:bg-white transition-all duration-200"
                        aria-expanded={showBgColorPicker}
                        aria-haspopup="true"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-6 h-6 rounded-lg border-2 border-white shadow-sm"
                            style={{ backgroundColor: bgColor }}
                          />
                          <span className="text-sm font-mono text-slate-700">
                            {bgColor}
                          </span>
                        </div>
                        <svg
                          className="w-4 h-4 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {showBgColorPicker && (
                        <div className="absolute z-20 mt-2">
                          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-4">
                            <ChromePicker
                              color={bgColor}
                              onChange={(color) => setBgColor(color.hex)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload logo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Logo (optionnel)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-slate-50 hover:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      aria-describedby="logo-help"
                    />
                    <p id="logo-help" className="mt-1 text-xs text-slate-500">
                      Formats acceptés: PNG, JPG, SVG. Taille recommandée:
                      64x64px
                    </p>
                  </div>
                </div>

                {/* Bouton télécharger avec loading */}
                <button
                  onClick={handleDownload}
                  disabled={!text || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 relative overflow-hidden btn-hover-effect"
                  aria-describedby={!text ? "download-help" : undefined}
                >
                  <div className="flex items-center justify-center space-x-2 relative z-10">
                    {isLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>Génération en cours...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span>Télécharger QR Code</span>
                      </>
                    )}
                  </div>

                  {/* Animation de loading en arrière-plan */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-75">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse"></div>
                    </div>
                  )}
                </button>

                {!text && (
                  <p
                    id="download-help"
                    className="text-xs text-slate-500 text-center"
                  >
                    Entrez d'abord un texte pour pouvoir télécharger le QR code
                  </p>
                )}

                {/* Message de succès */}
                {showSuccess && (
                  <div className="success-message rounded-xl p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-800">
                          QR Code téléchargé avec succès !
                        </p>
                        <p className="text-xs text-green-600">
                          Le fichier a été sauvegardé dans votre dossier de
                          téléchargements.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Aperçu */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Aperçu
                </h2>
              </div>

              <div className="flex justify-center">
                <div
                  ref={qrRef}
                  className="p-6 rounded-2xl shadow-sm border border-slate-200"
                  style={{ backgroundColor: bgColor }}
                >
                  {text ? (
                    <div className="relative inline-block">
                      <QRCodeSVG
                        value={text}
                        size={240}
                        fgColor={qrColor}
                        bgColor={bgColor}
                        level="H"
                        style={{ borderRadius: "12px" }}
                      />
                      {logo && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                            <img
                              src={logo}
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-[240px] h-[240px] border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center bg-slate-50">
                      <div className="text-center">
                        <svg
                          className="w-12 h-12 text-slate-400 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-slate-500 text-sm font-medium">
                          Entrez un texte pour voir l'aperçu
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Informations supplémentaires */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Conseils d'utilisation
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    Utilisez des couleurs contrastées pour une meilleure
                    lisibilité
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>
                    Le logo doit être de petite taille pour ne pas altérer la
                    lecture
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <svg
                    className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Testez votre QR code avec différents scanners</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>© 2024 Qrious Code. Générateur de QR codes personnalisés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
