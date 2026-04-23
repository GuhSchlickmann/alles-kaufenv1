import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LottieLogo: React.FC<{ size?: number }> = ({ size = 40 }) => {
  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <DotLottieReact
        src="/logo.lottie"
        loop
        autoplay
      />
    </div>
  );
};

export default LottieLogo;
