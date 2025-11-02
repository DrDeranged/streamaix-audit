// Mobile wallet utilities for deep linking

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /android/i.test(navigator.userAgent);
}

export function openMetaMaskMobile(dappUrl?: string): void {
  const url = dappUrl || window.location.href;
  const deepLink = `https://metamask.app.link/dapp/${url.replace(/^https?:\/\//, '')}`;
  
  window.location.href = deepLink;
}

export function openCoinbaseMobile(dappUrl?: string): void {
  const url = dappUrl || window.location.href;
  const deepLink = `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}`;
  
  window.location.href = deepLink;
}

// Check if we're already in a mobile wallet browser
export function isInMobileWalletBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ethereum = (window as any).ethereum;
  
  // MetaMask mobile browser
  if (ethereum?.isMetaMask && isMobile()) {
    return true;
  }
  
  // Coinbase Wallet mobile browser
  if (ethereum?.isCoinbaseWallet && isMobile()) {
    return true;
  }
  
  return false;
}

// Get wallet availability for mobile
export function getMobileWalletAvailability() {
  const mobile = isMobile();
  const inWalletBrowser = isInMobileWalletBrowser();
  const hasInjectedProvider = typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
  
  return {
    isMobile: mobile,
    isInWalletBrowser: inWalletBrowser,
    canUseDeepLink: mobile && !inWalletBrowser,
    hasInjectedProvider,
    recommendedAction: mobile 
      ? (inWalletBrowser ? 'connect' : 'deeplink')
      : 'install_extension'
  };
}
