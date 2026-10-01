import React from 'react';

export const getMFSLogoPath = (provider) => {
  if (!provider) return null;
  const p = provider.toLowerCase().trim();
  if (p.includes('bkash')) return '/MFS log/bkash.png';
  if (p.includes('nagad') || p.includes('nogod')) return '/MFS log/nogod.png';
  if (p.includes('rocket') || p.includes('roket')) return '/MFS log/roket.png';
  if (p.includes('upay')) return '/MFS log/upay.png';
  return null;
};

export const MFSLogo = ({ provider, className = 'h-5 w-auto object-contain', showText = true }) => {
  const logoPath = getMFSLogoPath(provider);

  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {logoPath ? (
        <img 
          src={logoPath} 
          alt={provider} 
          className={className} 
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : null}
      {showText && <span className="font-extrabold uppercase">{provider}</span>}
    </span>
  );
};
