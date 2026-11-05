import React, { useState } from 'react';
import { Product, ProductStock, MonthlyOrderAllocation } from '../types/inventory';
import { formatCOP, getDaysOfAutonomy, getTotalStockMl } from '../utils/calculations';
import { Sparkles, Send, Bot, User, CheckCircle2, AlertCircle, HelpCircle, ArrowRight, Zap } from 'lucide-react';

interface AiBiomedicalAdvisorProps {
  products: Product[];
  stockList: ProductStock[];
  monthlyPlan: MonthlyOrderAllocation[];
  monthlyBudgetCap: number;
  onApplyAiAction?: (action: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: string;
    productId?: string;
    productUpdates?: any;
    stockUpdates?: any;
    tab?: string;
    label: string;
    description?: string;
  };
  isActionApplied?: boolean;
}

export const AiBiomedicalAdvisor: React.FC<AiBiomedicalAdvisorProps> = ({
  products,
  stockList,
  monthlyPlan,
  monthlyBudgetCap,
  onApplyAiAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `¡Hola! Soy tu Asesor Clínico y Copilot Biomédico para UCI Honda (Tolima).
Conozco al detalle los 8 insumos de asepsia, consumos diarios, precios con 19% IVA y la regla estricta de rotación mensual bajo el techo de **$3.000.000 COP**.

Puedes consultarme cualquier cambio (ej. *"Quigrass dura solo 90 días y no tengo stock"*, o *"¿Qué insumos pedir primero?"*) y te entregaré los cálculos exactos y botones de ajuste directo.`,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const quickPrompts = [
    'no tengo quigrass necesito actualizar porque dura solo 90 dias no 180 ayudame con las ordenes de compra',
    '¿Qué insumos debo pedir con urgencia máxima en el primer pedido?',
    '¿Cómo balancear el Enziger de $297.000 + IVA para no quebrar el techo de $3M?',
    'Si en marzo tenemos un brote en UCI y Quirucidal se gasta cada 4 días, ¿qué impacto económico tiene?',
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      // Build real-time context
      const context = {
        monthlyBudgetCap,
        productsSummary: products.map((p) => {
          const s = stockList.find((item) => item.productId === p.id);
          return {
            id: p.id,
            name: p.name,
            daysPerGallon: p.daysPerGallon,
            unitPriceNet: p.unitPriceNet,
            autonomyDays: s ? getDaysOfAutonomy(p, s).toFixed(1) : '0',
          };
        }),
        currentMonthPlan: monthlyPlan[0]?.quantities || {},
      };

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          context,
        }),
      });

      const data = await res.json();
      const aiReply: ChatMessage = {
        id: 'reply_' + Date.now(),
        sender: 'ai',
        text: data.reply || 'No fue posible procesar la respuesta en este momento.',
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: data.suggestedAction || undefined,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: 'err_' + Date.now(),
        sender: 'ai',
        text: 'Error conectando con el servicio de IA. Verifique la conexión al servidor.',
        timestamp: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleExecuteAction = (msgId: string, action: any) => {
    if (onApplyAiAction) {
      onApplyAiAction(action);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, isActionApplied: true } : m))
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-800/60 rounded-2xl p-5 shadow-lg text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Copilot Biomédico UCI Honda <span className="text-xs font-mono font-normal text-purple-300">Asistente Clínico Contextual</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Consultor especializado en logística hospitalaria, optimización presupuestal bajo techo de $3.000.000 COP, y control de desabastecimiento.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[600px] overflow-hidden">
        {/* Messages scroll area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-purple-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-amber-300" />
                )}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Action button if suggested by AI */}
                {msg.suggestedAction && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/80">
                    {msg.isActionApplied ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>¡Acción aplicada en el CRM! Inventario y órdenes sincronizados.</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleExecuteAction(msg.id, msg.suggestedAction)}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/20 w-full sm:w-auto"
                      >
                        <Zap className="w-4 h-4 text-amber-300" />
                        <span>{msg.suggestedAction.label}</span>
                      </button>
                    )}
                    {msg.suggestedAction.description && !msg.isActionApplied && (
                      <span className="block text-[11px] text-slate-500 mt-1">
                        {msg.suggestedAction.description}
                      </span>
                    )}
                  </div>
                )}

                <span
                  className={`block text-[10px] mt-1.5 text-right font-mono ${
                    msg.sender === 'user' ? 'text-cyan-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 animate-pulse pl-11">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>BioStock AI está formulando el análisis biomédico...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestions */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" /> Consultas frecuentes:
          </span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap text-xs transition-colors cursor-pointer"
            >
              {q.length > 55 ? q.slice(0, 52) + '...' : q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Haz una consulta sobre insumos, compras rotativas o cálculos de UCI..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 shadow-md shadow-purple-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
