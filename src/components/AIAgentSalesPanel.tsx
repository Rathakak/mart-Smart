import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Volume2, 
  Plus, 
  Check, 
  ScanLine, 
  Loader2,
  Tag,
  ArrowRight
} from 'lucide-react';
import { Product, ChatMessage } from '../types';
import { soundManager } from '../utils/audio';

interface AIAgentSalesPanelProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onApplyPromo: (code: string) => void;
  onOpenScanner: () => void;
  cartSummary: { nameKh: string; quantity: number }[];
}

export const AIAgentSalesPanel: React.FC<AIAgentSalesPanelProps> = ({
  products,
  onAddToCart,
  onApplyPromo,
  onOpenScanner,
  cartSummary,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'agent',
      text: 'ជម្រាបសួរអតិថិជនជាទីស្រឡាញ់! 🙏 នាងខ្ញុំ សុវណ្ណលីតា ជាភ្នាក់ងារ AI ប្រចាំម៉ាត Smart Mart រីករាយណាស់ដែលបានបម្រើលោកអ្នក! ខ្ញុំឆ្លើយតបយ៉ាងរាក់ទាក់ ផ្អែកលើព័ត៌មានជាក់ស្តែងដែលមានក្នុងស្តុកម៉ាតផ្ទាល់ មិនឆ្លើយប៉ាន់ស្មានជាដាច់ខាត។\n\nតើថ្ងៃនេះលោកអ្នកចង់រកភេសជ្ជៈត្រជាក់ៗ អាហារសម្រន់ឆ្ងាញ់ៗ ឬត្រូវការអ្វីដែរ?',
      timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
      recommendedProductIds: ['p-cof-01', 'p-food-01', 'p-bev-01', 'p-food-02'],
      suggestedReplies: [
        '☕ ចង់បានកាហ្វេ និងនំពេលព្រឹក',
        '🍜 ណែនាំមី និងអាហាររហ័សឆ្ងាញ់ៗ',
        '⚡ មានភេសជ្ជៈប៉ូវកម្លាំងអត់?',
        '🎁 សុំមើលប្រូម៉ូសិនថ្ងៃនេះ'
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Web Speech API Voice Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'km-KH'; // Khmer or fallback to en-US

        recognition.onresult = (event: any) => {
          const speechResult = event.results[0][0].transcript;
          if (speechResult) {
            setInputVal(speechResult);
            handleSendMessage(speechResult);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [products]);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('កម្មវិធីរុករកនេះមិនទាន់គាំទ្រ Speech Recognition ទេ។ សូមវាយជាអក្សរជំនួសវិញ!');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query || isLoading) return;

    soundManager.playBeep();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      // Send to server-side Gemini route
      const catalogSummary = products.map((p) => ({
        id: p.id,
        nameKh: p.nameKh,
        nameEn: p.nameEn,
        category: p.category,
        priceUsd: p.priceUsd,
        priceKhr: p.priceKhr,
        stock: p.stock,
        tags: p.tags,
      }));

      const res = await fetch('/api/mart/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          catalogSummary,
          currentCart: cartSummary,
          conversationHistory: messages.map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      let data: any = null;
      if (res.ok) {
        data = await res.json();
      }

      if (!data || !data.reply) {
        const lower = query.toLowerCase();
        const matchedItems = products.filter(
          (p) =>
            p.tags.some((t) => lower.includes(t)) ||
            p.nameKh.includes(query) ||
            p.nameEn.toLowerCase().includes(lower)
        );

        const isThaiQuery = /ថៃ|thai|ម៉ាម៉ា|mama|ការ៉ាបាវ|carabao|chang|singha/i.test(lower);
        let fallbackReply = '';
        let recommendedIds: string[] = [];

        if (isThaiQuery) {
          fallbackReply = `សូមអភ័យទោសផងចាស៎! 🙏 ម៉ាតយើងខ្ញុំមិនដាក់ និងមិនលក់មុខទំនិញថៃជាដាច់ខាតឡើយ។ យើងខ្ញុំគាំទ្រយ៉ាងពេញទំហឹងនូវផលិតផលជាតិខ្មែរគុណភាពខ្ពស់ដូចជា មីជាតិ, ភេសជ្ជៈប៉ូវកម្លាំង វើកស៍ (Wurkz) / គ្រុឌ (Krud), និងទឹកបរិសុទ្ធ វីតាល់ (Vital)។ តើលោកអ្នកចង់ឱ្យខ្ញុំណែនាំផលិតផលខ្មែរឆ្នើមៗទាំងនេះជូនដែរទេ?`;
          recommendedIds = ['p-food-01', 'p-bev-02', 'p-bev-03', 'p-bev-04'];
        } else if (matchedItems.length > 0) {
          fallbackReply = `ចាស៎ ជម្រាបសួរអតិថិជនជាទីស្រឡាញ់! នាងខ្ញុំ សុវណ្ណលីតា បានផ្ទៀងផ្ទាត់ក្នុងស្តុកម៉ាត ឃើញមានទំនិញដែលលោកអ្នកត្រូវការដូចជា៖ ${matchedItems.slice(0, 2).map((p) => p.nameKh).join(', ')}។ តើលោកអ្នកចង់បន្ថែមទៅក្នុងកន្ត្រកដែរទេ?`;
          recommendedIds = matchedItems.slice(0, 3).map((p) => p.id);
        } else {
          fallbackReply = `សូមអភ័យទោសផងចាស៎! 🙏 ចំពោះទំនិញ ឬព័ត៌មាន "${query}" នេះ ម៉ាតយើងខ្ញុំពុំទាន់មានក្នុងស្តុក ឬពុំទាន់មានព័ត៌មានច្បាស់លាស់នៅឡើយទេ។ នាងខ្ញុំ សុវណ្ណលីតា មិនហ៊ានឆ្លើយប៉ាន់ស្មានជូនលោកអ្នកជាដាច់ខាតឡើយ។ តើលោកអ្នកចង់ឱ្យខ្ញុំណែនាំទំនិញដែលមានស្រាប់នៅលើធ្នើក្នុងម៉ាតវិញដែរទេ?`;
          recommendedIds = [];
        }

        data = {
          reply: fallbackReply,
          action: null,
          recommendedProductIds: recommendedIds,
          suggestedReplies: ['មើលទំនិញលើធ្នើ', 'មើលប្រូម៉ូសិនថ្ងៃនេះ', 'ពិនិត្យកន្ត្រក'],
        };
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: data.reply || 'នាងខ្ញុំ សុវណ្ណលីតា រីករាយណាស់ដែលបានជួយលោកអ្នក!',
        timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
        action: data.action,
        recommendedProductIds: data.recommendedProductIds,
        suggestedReplies: data.suggestedReplies,
      };

      setMessages((prev) => [...prev, agentMsg]);

      // Execute automated actions if recommended by AI
      if (data.action) {
        if (data.action.type === 'ADD_TO_CART' && Array.isArray(data.action.items)) {
          data.action.items.forEach((item: any) => {
            const productToAdd = products.find((p) => p.id === item.productId);
            if (productToAdd) {
              onAddToCart(productToAdd, item.quantity || 1);
            }
          });
          soundManager.playBeep();
        } else if (data.action.type === 'APPLY_PROMO' && data.action.promoCode) {
          onApplyPromo(data.action.promoCode);
        }
      }

      // Voice read aloud if sound enabled
      soundManager.speak(data.reply);
    } catch (err) {
      console.warn('AI Mart Agent response handler note:', err);
      const fallbackReply = `សូមអភ័យទោសផងចាស៎! 🙏 ចំពោះសំណើនេះ នាងខ្ញុំ សុវណ្ណលីតា សូមផ្ទៀងផ្ទាត់ជូនម្តងទៀត ឬលោកអ្នកអាចជ្រើសរើសទំនិញលើធ្នើបានភ្លាមៗ!`;
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-fallback-${Date.now()}`,
          sender: 'agent',
          text: fallbackReply,
          timestamp: new Date().toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' }),
          recommendedProductIds: ['p-food-01', 'p-bev-01'],
          suggestedReplies: ['មើលទំនិញលើធ្នើ', 'មើលប្រូម៉ូសិនថ្ងៃនេះ', 'ពិនិត្យកន្ត្រក'],
        },
      ]);
      soundManager.speak(fallbackReply);
    } finally {
      setIsLoading(false);
    }
  };

  const findProduct = (id: string): Product | undefined => {
    return products.find((p) => p.id === id);
  };

  return (
    <div className="flex flex-col h-[580px] lg:h-[620px] bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Agent Persona Top Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-inner">
              <Bot className="w-5 h-5 text-emerald-200" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-emerald-900"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide">សុវណ្ណលីតា • ភ្នាក់ងារ AI លក់ក្នុងម៉ាត</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/90 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              <span>ឆ្លើយតបរស់រវើក • សមរម្យ • ព័ត៌មានជាក់ស្តែង មិនប៉ាន់ស្មាន</span>
            </p>
          </div>
        </div>

        {/* Quick scanner button */}
        <button
          onClick={onOpenScanner}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-emerald-100 border border-white/20 transition-all active:scale-95"
          title="ស្កេនទំនិញតាមកាមេរ៉ា"
        >
          <ScanLine className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">ស្កេនរូប</span>
        </button>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => {
          const isAgent = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                  isAgent
                    ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                    : 'bg-emerald-600 text-white rounded-tr-sm shadow-emerald-600/10'
                }`}
              >
                {/* Agent Header badge */}
                {isAgent && (
                  <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100">
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      Smart Mart Assistant
                    </span>
                    <button
                      onClick={() => soundManager.speak(msg.text)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                      title="ស្តាប់សំឡេង"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Message Body */}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Action Execution Pill */}
                {msg.action && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                    {msg.action.type === 'ADD_TO_CART' && (
                      <span>បានបន្ថែមទំនិញទៅក្នុងកន្ត្រករួចរាល់!</span>
                    )}
                    {msg.action.type === 'APPLY_PROMO' && (
                      <span>បានបញ្ចុះតម្លៃប្រូម៉ូសិនជូនរួចរាល់!</span>
                    )}
                  </div>
                )}

                {/* Recommended Product Cards inside Chat */}
                {msg.recommendedProductIds && msg.recommendedProductIds.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      ទំនិញណែនាំពិសេស (Recommended Items):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {msg.recommendedProductIds.map((pId) => {
                        const product = findProduct(pId);
                        if (!product) return null;
                        return (
                          <div
                            key={product.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 transition-all"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xl shrink-0 p-1 bg-white rounded-lg border border-slate-100 shadow-2xs">
                                {product.emoji}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-800 truncate">
                                  {product.nameKh}
                                </h4>
                                <div className="flex items-center gap-1 text-[11px]">
                                  <span className="font-bold text-emerald-700 font-sans">
                                    ${product.priceUsd.toFixed(2)}
                                  </span>
                                  <span className="text-slate-400">|</span>
                                  <span className="text-slate-500 font-sans">
                                    {product.priceKhr.toLocaleString()} ៛
                                  </span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                onAddToCart(product);
                                soundManager.playBeep();
                              }}
                              className="shrink-0 ml-2 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-transform active:scale-90"
                              title="ដាក់ក្នុងកន្ត្រក"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-1 text-right text-[10px] opacity-70">
                  {msg.timestamp}
                </div>
              </div>

              {/* Quick Reply Chips from Agent */}
              {isAgent && msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                  {msg.suggestedReplies.map((replyText, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(replyText)}
                      className="px-2.5 py-1 text-xs rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-2xs text-left"
                    >
                      {replyText}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs flex items-center gap-2 text-xs text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>ភ្នាក់ងារ AI កំពុងស្វែងរកទំនិញជូនលោកអ្នក...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            id="agent-voice-btn"
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl border transition-all ${
              isListening
                ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title={isListening ? 'កំពុងស្តាប់... ចុចដើម្បីបិទ' : 'ចុចដើម្បីនិយាយ (Voice Input)'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text input */}
          <div className="relative flex-1">
            <input
              type="text"
              id="agent-chat-input"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="សួរតម្លៃ, ណែនាំទំនិញ, ឬប្រាប់ 'យកកូកា ២ កំប៉ុង'..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              disabled={isLoading}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            id="agent-send-btn"
            disabled={!inputVal.trim() || isLoading}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white shadow-xs transition-all active:scale-95 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {isListening && (
          <div className="mt-2 text-center text-xs font-semibold text-rose-600 animate-pulse">
            🎙️ កំពុងស្តាប់សំឡេងរបស់លោកអ្នកជាភាសាខ្មែរ... សូមនិយាយ!
          </div>
        )}
      </div>
    </div>
  );
};
