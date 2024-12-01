import { useEffect, useState } from "react";


export default function useActorLoader(fetcher) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        await fetcher();
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setIsLoading(false)
      }
    }
    load();
  }, [])

  return {
    isLoading,
  }
}