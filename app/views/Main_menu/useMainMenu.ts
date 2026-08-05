import { useState, useEffect } from 'react';

export const useMainMenu = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch('https://www.google.com', {
          method: 'HEAD',
          signal: controller.signal,
          cache: 'no-cache'
        });
        clearTimeout(timeoutId);
        if (isMounted) setIsOnline(response.ok);
      } catch (e) {
        if (isMounted) setIsOnline(false);
      }
    };

    // Verificar inmediatamente
    checkConnection();

    // Verificar cada 30 segundos
    const interval = setInterval(checkConnection, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isOnline };
};
