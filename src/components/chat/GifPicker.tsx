import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Gif {
  id: string;
  url: string;
  preview: string;
  title: string;
}

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

export const GifPicker = ({ onSelect }: GifPickerProps) => {
  const [query, setQuery] = useState('');
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);

  const searchGifs = async (searchQuery: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('giphy-search', {
        body: { query: searchQuery, limit: 20 },
      });

      if (error) throw error;
      setGifs(data.gifs || []);
    } catch (error) {
      console.error('Failed to fetch GIFs:', error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchGifs(query);
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  useEffect(() => {
    searchGifs('');
  }, []);

  return (
    <div className="w-80 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
      <div className="p-2 border-b border-border">
        <Input
          placeholder="Search GIFs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8"
        />
      </div>
      <ScrollArea className="h-64">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 p-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.url)}
                className="rounded overflow-hidden hover:opacity-80 transition-opacity focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <img
                  src={gif.preview}
                  alt={gif.title}
                  className="w-full h-24 object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
      <div className="p-1 border-t border-border text-center">
        <span className="text-[10px] text-muted-foreground">Powered by GIPHY</span>
      </div>
    </div>
  );
};
