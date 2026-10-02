import React from 'react';
import { BRAND_ASSETS } from '../config/assets';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[VENM SYSTEM ERROR]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="max-w-md w-full border border-neutral-800 bg-neutral-950 p-8 rounded-none shadow-2xl space-y-6">
            <div className="flex justify-center">
              <img
                src={BRAND_ASSETS.LOGO_PRIMARY}
                alt="VENM"
                className="h-10 w-auto invert filter object-contain"
              />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-mono uppercase tracking-widest text-lime-400 font-bold">
                SOMETHING WENT WRONG
              </h1>
              <p className="text-xs text-neutral-400 font-mono tracking-wider">
                AN UNEXPECTED APPLICATION ERROR OCCURRED.
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full py-3.5 px-6 bg-lime-400 hover:bg-lime-300 text-black font-mono text-xs uppercase tracking-widest font-bold transition-all duration-200"
            >
              REFRESH APPLICATION
            </button>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <div className="text-left bg-neutral-900 p-3 text-[10px] font-mono text-red-400 overflow-x-auto border border-neutral-800">
                {this.state.error.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
