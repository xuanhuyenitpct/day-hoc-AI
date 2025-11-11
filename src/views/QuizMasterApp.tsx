import React, { useState, useEffect, useCallback } from "react";
import { GoogleGenAI, Type } from "@google/genai";
import { useApiKey } from '../context/ApiContext';

const CHARACTERS = [
    { name: 'Nhà Thám Hiểm', image: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>')}`},
    { name: 'Phi Hành Gia', image: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.33.2-3.3-1.22-2.3-1.66-5.64-.8-8 1.2-3.4 4.9-5.4 8.5-4.4.8.23 1.54.74 2.1 1.3 1.13 1.13 1.62 3.2 1.2 5.5-.42 2.3-2.68 4.34-5 4.9-2.3.58-5.7.9-8.1.1Z"/><path d="m12 12 4 4"/><path d="M17.5 10.5c-2.5-1-4.8-3.5-5-5.5"/><path d="m9 15 1-1"/><path d="M12.5 11.5 11 13"/></svg>')}`},
    { name: 'Hiệp Sĩ Rồng', image: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="white"><path d="M64 32C28.7 32 0 60.7 0 96v320c0 35.3 28.7 64 64 64h320c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm183.3 203.4c6.4-3.1 13.4-3.1 19.7 0l85.2 41.2c14.2 6.9 14.2 26.5 0 33.4l-85.2 41.2c-6.4 3.1-13.4 3.1-19.7 0l-85.2-41.2c-14.2-6.9-14.2-26.5 0-33.4l85.2-41.2z"/></svg>').replace('path d="M64', 'path transform="scale(0.8) translate(50, 50)" d="M224 0c17.7 0 32 14.3 32 32V48h16c17.7 0 32 14.3 32 32s-14.3 32-32 32H256v48c0 17.7-14.3 32-32 32s-32-14.3-32-32V112H160c-17.7 0-32-14.3-32-32s14.3-32 32-32h32V32c0-17.7 14.3-32 32-32zM80 256c0-17.7 14.3-32 32-32h16c17.7 0 32 14.3 32 32v32h32c17.7 0 32 14.3 32 32s-14.3 32-32 32H192v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V352H96c-17.7 0-32-14.3-32-32s14.3-32 32-32h16v-32c0-17.7-14.3-32-32-32s-32 14.3-32 32v32c0 53 43 96 96 96h32c53 0 96-43 96-96V256c0-53-43-96-96-96H128C75 160 32 203 32 256v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V256C0 167.2 71.2 96 160 96h128c88.8 0 160 71.2 160 160v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V256c0-53-43-96-96-96h-32c-53 0-96 43-96 96v32z"/></svg>')}`},
    { name: 'Phù Thủy Tí Hon', image: `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="white"><path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM128 256a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm256-48a48 48 0 1 1 0 96 48 48 0 1 1 0 -96z"/></svg>').replace('path d="M288', 'path transform="scale(0.9) translate(30, 20)" d="M543.9 46.1c-13.4-15.6-36.2-17.3-51.9-3.9L316.5 192H168c-26.5 0-48 21.5-48 48v80c0 26.5 21.5 48 48 48h148.5l175.4 149.9c15.6 13.4 38.5 11.7 51.9-3.9c13.4-15.6 11.7-38.5-3.9-51.9L240.1 320H168v-80h72.1L539.9 98c15.7-13.4 17.4-36.2 4-51.9z"/></svg>')}`},
];

const PdfPreview = ({ url, name }) => (
  <div className="h-96 w-full bg-black/20">
    <object data={url} type="application/pdf" className="w-full h-full">
      <embed src={url} type="application/pdf" className="w-full h-full" />
      <div className="p-4 text-sm">
        Không xem được PDF trong trình duyệt.
        <a href={url} target="_blank" rel="noreferrer" className="underline ml-1">Mở tab mới</a> hoặc lưu về máy.
      </div>
    </object>
  </div>
);

const clamp = (n, min, max) => Math.min(Math.max(n, min, max));
const shuffle = (arr) => arr.map((a) => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map((a) => a[1]);

function longestStreak(bools) {
  let best = 0, cur = 0;
  for (const b of bools) {
    if (b) { cur++; best = Math.max(best, cur); } else { cur = 0; }
  }
  return best;
}

async function tryImportESM(urls) {
  for (const url of urls) {
    try {
      // @ts-ignore – allow dynamic remote imports
      const mod = await import(/* @vite-ignore */ url);
      return mod;
    } catch (e) { /* try next */ }
  }
  throw new Error("cdn-import-failed");
}

function makeMCFromCards(cards, count = 5) {
  const qs = [];
  const pool = shuffle(cards);
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const correct = pool[i];
    const distractors = shuffle(cards.filter((c) => c.front !== correct.front)).slice(0, 3).map((c) => c.back);
    const opts = shuffle([correct.back, ...distractors]);
    qs.push({ id: i + 1, type: "mc", q: correct.front, opts, a: opts.indexOf(correct.back), explanation: `Đáp án đúng là "${correct.back}" vì nó tương ứng với mặt trước của thẻ: "${correct.front}".` });
  }
  return qs;
}

async function copyTextSafe(text) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return 'success';
    }
  } catch (e) { /* fallthrough */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-1000px';
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok = document.execCommand && document.execCommand('copy');
    document.body.removeChild(ta);
    if (ok) return 'fallback';
  } catch (e) { /* fallthrough */ }
  return 'manual';
}

export const QuizMasterApp = ({ userRole = 'student' }) => {
  const { runWithApiKey, apiKey } = useApiKey();
  const [stage, setStage] = useState("builder");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [countInput, setCountInput] = useState('5');
  const [types, setTypes] = useState([
    { key: "mc", label: "Trắc nghiệm", checked: true },
    { key: "tf", label: "Đúng / Sai", checked: false },
    { key: "fill", label: "Điền vào chỗ trống", checked: false },
  ]);
  const [imageName, setImageName] = useState("");
  const [imageBase64, setImageBase64] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [geminiFeedback, setGeminiFeedback] = useState({ title: "", body: "" });

  const [pdfName, setPdfName] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [pdfPassword, setPdfPassword] = useState("");
  const [needPassword, setNeedPassword] = useState(false);
  const [pdfCardCount, setPdfCardCount] = useState(5);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [correctness, setCorrectness] = useState([]);
  const [result, setResult] = useState(null);
  
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  type CardStatus = 'new' | 'mastered' | 'needs review';
  const [cards, setCards] = useState<{ front: string; back: string; status: CardStatus }[]>([]);
  const [cardFilter, setCardFilter] = useState<'all' | 'needsReview' | 'notMastered'>('all');
  const [quizFromCardsStrategy, setQuizFromCardsStrategy] = useState<'all' | 'needsReview' | 'notMastered'>('notMastered');
    
  const [learningKit, setLearningKit] = useState(null);

  const [hasSavedCards, setHasSavedCards] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'fallback' | 'manual'>('idle');
  
  const [assignmentId, setAssignmentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [viewingAssignment, setViewingAssignment] = useState(null);

  const [builderMode, setBuilderMode] = useState<'choice' | 'kit' | 'pdf'>('choice');
  
  const [shareModalContent, setShareModalContent] = useState(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const assignmentIdFromUrl = urlParams.get('assignment');
    if (assignmentIdFromUrl) {
        const allAssignments = JSON.parse(localStorage.getItem('eduquiz:assignments') || '[]');
        const assignment = allAssignments.find(a => a.id === assignmentIdFromUrl);
        if (assignment) {
            setTopic(assignment.topic);
            setQuestions(assignment.questions);
            setAssignmentId(assignment.id);
            setStage('studentNameEntry');
        } else {
            alert('Không tìm thấy bài tập được giao.');
        }
        return;
    }
    
    console.debug('[EduQuiz] mounted');
    const savedAssignments = JSON.parse(localStorage.getItem("eduquiz:assignments") || '[]');
    const savedSubmissions = JSON.parse(localStorage.getItem("eduquiz:submissions") || '{}');
    setAssignments(savedAssignments);
    setSubmissions(savedSubmissions);

    const savedSession = localStorage.getItem("eduquiz:session");
    if (savedSession) {
      try {
        if (window.confirm("Tìm thấy một phiên làm việc chưa hoàn tất. Bạn có muốn tiếp tục không?")) {
          const sessionData = JSON.parse(savedSession);
          setStage(sessionData.stage || 'builder');
          setTopic(sessionData.topic || '');
          setQuestions(sessionData.questions || []);
          setAnswers(sessionData.answers || {});
          setCards(sessionData.cards || []);
          setPdfName(sessionData.pdfName || '');
          setLearningKit(sessionData.learningKit || null);
          return;
        } else {
          localStorage.removeItem("eduquiz:session");
        }
      } catch (e) {
        console.error("Failed to load session:", e);
        localStorage.removeItem("eduquiz:session");
      }
    }
    
    const savedCardsData = localStorage.getItem("eduquiz:saved_cards");
    setHasSavedCards(!!savedCardsData);

  }, []);
  
    useEffect(() => {
        if (count.toString() !== countInput) {
            setCountInput(count.toString());
        }
    }, [count]);

  useEffect(() => {
    const isProgressStage = ['learningKit', 'review', 'quiz', 'cards', 'share'].includes(stage);
    if (isProgressStage && !assignmentId) {
      const sessionData = {
        stage, topic, questions, answers, cards, pdfName, learningKit,
      };
      localStorage.setItem('eduquiz:session', JSON.stringify(sessionData));
    }
  }, [stage, topic, questions, answers, cards, pdfName, learningKit]);

  useEffect(() => {
    if (stage === 'result' && result && !assignmentId) {
      runWithApiKey(generateFeedbackWithGemini);
    }
  }, [stage, result]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageName("");
      setImageBase64("");
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result?.toString().split(',')[1];
      setImageBase64(base64String || "");
    };
    reader.readAsDataURL(file);
  };

  const generateLearningKitWithGemini = async () => {
      if (!topic && !imageBase64) {
          setGenerationError("Vui lòng nhập chủ đề hoặc tải lên hình ảnh để tạo bộ tài liệu.");
          return;
      }

      setIsGenerating(true);
      setGenerationError("");

      try {
          if (!apiKey) throw new Error("API Key is not set.");
          const ai = new GoogleGenAI({ apiKey });
          const selectedTypesText = types.filter(t => t.checked).map(t => t.label).join(', ');

          const prompt = `Bạn là một trợ lý giáo dục AI đa năng. Từ nội dung được cung cấp, hãy tạo ra một "Bộ Tài Liệu Học Tập" hoàn chỉnh.
Nội dung/Chủ đề: "${topic || 'dựa trên hình ảnh'}"
Số lượng câu hỏi: ${count}
Các dạng câu hỏi: ${selectedTypesText || 'Trắc nghiệm'}

Hãy trả về một đối tượng JSON duy nhất có cấu trúc như sau:
{
  "summary": "Một đoạn tóm tắt các ý chính của nội dung, dưới dạng gạch đầu dòng.",
  "flashcards": [ { "front": "Thuật ngữ hoặc câu hỏi", "back": "Định nghĩa hoặc câu trả lời" } ],
  "questions": [ /* mảng các câu hỏi theo schema đã cho */ ],
  "criticalThinkingQuestion": "Một câu hỏi mở, sâu sắc để kích thích tư duy phản biện."
}`;
          
          const parts: ({ text: string } | { inlineData: { mimeType: string; data: string; } })[] = [{ text: prompt }];

          if (imageBase64) {
              const mimeType = imageName.endsWith('.png') ? 'image/png' : imageName.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
              parts.unshift({
                  inlineData: { mimeType, data: imageBase64, },
              });
          }

          const questionSchema = {
              type: Type.OBJECT,
              properties: {
                  id: { type: Type.NUMBER },
                  type: { type: Type.STRING, enum: ['mc', 'tf', 'fill'] },
                  q: { type: Type.STRING },
                  opts: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                  a: { type: [Type.NUMBER, Type.STRING, Type.BOOLEAN], nullable: true },
                  explanation: { type: Type.STRING, nullable: true },
              },
              required: ['id', 'type', 'q']
          };

          const kitSchema = {
              type: Type.OBJECT,
              properties: {
                  summary: { type: Type.STRING },
                  flashcards: {
                      type: Type.ARRAY,
                      items: {
                          type: Type.OBJECT,
                          properties: {
                              front: { type: Type.STRING },
                              back: { type: Type.STRING },
                          },
                          required: ['front', 'back'],
                      },
                  },
                  questions: { type: Type.ARRAY, items: questionSchema },
                  criticalThinkingQuestion: { type: Type.STRING },
              },
              required: ['summary', 'flashcards', 'questions', 'criticalThinkingQuestion'],
          };

          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: { parts },
              config: {
                  responseMimeType: "application/json",
                  responseSchema: kitSchema,
              }
          });

          const jsonText = response.text;
          if (!jsonText) {
              throw new Error("API đã trả về một phản hồi trống. Điều này có thể do bộ lọc an toàn.");
          }
          const generatedKit = JSON.parse(jsonText.trim());

          setLearningKit(generatedKit);
          setQuestions(generatedKit.questions || []);
          setCards((generatedKit.flashcards || []).map(c => ({...c, status: 'new'})));
          setAnswers({});
          setCorrectness([]);
          setStage("learningKit");

      } catch (error) {
          console.error("Error generating learning kit:", error);
          const errorMessage = (error as Error).message || String(error);
          setGenerationError("Lỗi khi tạo bộ tài liệu: " + errorMessage);
      } finally {
          setIsGenerating(false);
      }
  };

  const generateFeedbackWithGemini = async () => {
    if (!result || !questions.length) return;

    setGeminiFeedback({ title: "", body: "Đang tạo nhận xét bằng AI..." });

    try {
        if (!apiKey) throw new Error("API Key is not set.");
        const ai = new GoogleGenAI({ apiKey });
        const pct = Math.round((result.score / result.total) * 100);

        const wrongAnswers = questions.map((q, i) => {
            if (!correctness[i]) {
                const userAnswer = answers[q.id];
                let correctAnswer;
                if (q.type === 'mc') correctAnswer = q.opts[q.a as number];
                else correctAnswer = q.a;
                return `Câu ${q.id}: "${q.q}" - Trả lời: "${userAnswer}", Đáp án đúng: "${correctAnswer}"`;
            }
            return null;
        }).filter(Boolean).join('\n');

        const prompt = `Bạn là một gia sư AI thân thiện và khích lệ. 
Một học sinh vừa hoàn thành bài kiểm tra về chủ đề "${topic || 'tổng quát'}" với kết quả ${result.score}/${result.total} (${pct}%).
Các câu trả lời sai của học sinh là:
${wrongAnswers || 'Không có câu nào sai.'}

Dựa vào kết quả này, hãy đưa ra một phản hồi gồm:
1.  Một tiêu đề (trường "title") thật lôi cuốn và tích cực (ví dụ: "Xuất sắc!", "Tiến bộ vượt bậc!", "Cố gắng hơn nhé!").
2.  Một nội dung (trường "body") phân tích ngắn gọn điểm mạnh, chỉ ra các lỗi sai chính và đưa ra 2-3 gợi ý cụ thể, hữu ích để học tốt hơn trong lần tới. Giọng văn cần thân thiện, khích lệ, không quá dài dòng.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        body: { type: Type.STRING },
                    },
                    required: ['title', 'body'],
                },
            },
        });

        const jsonText = response.text;
        if (!jsonText) {
            setGeminiFeedback({ title: "Lỗi", body: "Không thể tạo nhận xét tự động lúc này vì AI trả về phản hồi trống." });
            return;
        }
        const feedback = JSON.parse(jsonText.trim());
        setGeminiFeedback(feedback);

    } catch (error) {
        console.error("Error generating feedback:", error);
        setGeminiFeedback({ title: "Lỗi", body: "Không thể tạo nhận xét tự động lúc này." });
    }
  };

  const submitQuiz = (finalAnswers, finalCorrectness, finalScore) => {
    const total = questions.length;
    const streak = longestStreak(finalCorrectness);
    const pack = { score: finalScore, total: 100, streak, at: Date.now() };

    if (assignmentId && studentName) {
        const allSubmissions = JSON.parse(localStorage.getItem('eduquiz:submissions') || '{}');
        const newSubmission = { studentName, score: finalScore, answers: finalAnswers, correctness: finalCorrectness };
        
        const assignmentSubmissions = allSubmissions[assignmentId] || [];
        assignmentSubmissions.push(newSubmission);
        
        allSubmissions[assignmentId] = assignmentSubmissions;
        localStorage.setItem('eduquiz:submissions', JSON.stringify(allSubmissions));
    } else {
        localStorage.setItem("eduquiz:last", JSON.stringify(pack));
    }
    
    setAnswers(finalAnswers);
    setCorrectness(finalCorrectness); 
    setResult(pack); 
    setStage("result");
  };


  const resetAll = () => {
    localStorage.removeItem("eduquiz:session");
    const savedCardsData = localStorage.getItem("eduquiz:saved_cards");
    setHasSavedCards(!!savedCardsData);

    setStage("builder"); setTopic(""); setCount(5); setTypes((ts) => ts.map((t, i) => ({ ...t, checked: i === 0 })));
    setQuestions([]); setAnswers({}); setCorrectness([]);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl); setPdfName(""); setPdfUrl(""); setPdfFile(null); setCards([]); setParseError(""); setPdfPassword(""); setNeedPassword(false);
    setImageName(""); setImageBase64(""); setGenerationError(""); setGeminiFeedback({ title: "", body: "" });
    setCardFilter('all'); setQuizFromCardsStrategy('notMastered');
    setSelectedCharacter(null);
    setLearningKit(null);
    setBuilderMode('choice');
  };

  const parsePdfToCards = async () => {
    if (!pdfFile && !pdfUrl) return;
    setIsParsing(true);
    setParseError("");
    setNeedPassword(false);
    try {
      let pdfjsLib;
      try {
        pdfjsLib = await tryImportESM([
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs',
          'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.min.mjs'
        ]);
      } catch (e) {
        throw new Error('pdfjs-cdn-unavailable');
      }

      let buffer;
      if (pdfFile && typeof pdfFile.arrayBuffer === 'function') {
        buffer = await pdfFile.arrayBuffer();
      } else if (pdfUrl) {
        const resp = await fetch(pdfUrl);
        if (!resp.ok) throw new Error('fetch-failed');
        buffer = await resp.arrayBuffer();
      } else {
        throw new Error('no-source');
      }

      if (pdfjsLib?.GlobalWorkerOptions) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
      }

      const loadingTask = pdfjsLib.getDocument({ data: buffer, password: pdfPassword || undefined, isEvalSupported: false });

      let doc;
      try { doc = await loadingTask.promise; }
      catch (e) {
        const msg = String(e?.message||'').toLowerCase();
        if (e?.name === 'PasswordException' || msg.includes('password')) { setNeedPassword(true); throw new Error('password-needed'); }
        if (e?.name === 'InvalidPDFException' || msg.includes('invalid')) { throw new Error('invalid-pdf'); }
        if (e?.name === 'MissingPDFException' || msg.includes('missing')) { throw new Error('missing-pdf'); }
        throw e;
      }

      let full = '';
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        const strings = content.items.map((it) => it.str).filter(Boolean);
        full += strings.join(' ') + '\n';
      }

      let cleaned = full.replace(/\s+/g,' ').trim();

      if (!cleaned) {
        try {
          let TesseractMod;
          try {
            TesseractMod = await tryImportESM([
              'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js',
              'https://unpkg.com/tesseract.js@5.1.0/dist/tesseract.min.js'
            ]);
          } catch {}
          const createWorker = TesseractMod?.createWorker || TesseractMod?.Tesseract?.createWorker;
          if (!createWorker) throw new Error('ocr-unavailable');

          const worker = await createWorker({ logger: () => {} });
          await worker.loadLanguage('vie+eng');
          await worker.initialize('vie+eng');
          let ocrText = '';
          const maxPages = Math.min(3, doc.numPages);
          for (let p = 1; p <= maxPages; p++) {
            const page = await doc.getPage(p);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = viewport.width; canvas.height = viewport.height;
            await page.render({ canvasContext: ctx, viewport }).promise;
            const { data } = await worker.recognize(canvas);
            ocrText += (data?.text || '') + '\n';
          }
          await worker.terminate();
          cleaned = (ocrText || '').replace(/\s+/g,' ').trim();
          full = ocrText;
        } catch {
          // OCR unavailable; cleaned remains ''
        }
      }

      if (!cleaned) {
        setParseError('Không trích được văn bản từ PDF. Có thể PDF là bản scan/không có lớp text hoặc CDN OCR bị chặn. Hãy thử PDF văn bản (xuất từ Word/Docs) hoặc cung cấp mật khẩu nếu có.');
        setIsParsing(false);
        return;
      }
      
      try {
        if (!apiKey) throw new Error("API Key is not set.");
        const ai = new GoogleGenAI({ apiKey });
        const limit = clamp(pdfCardCount, 1, 20);
        const prompt = `Dựa vào đoạn văn bản trích xuất từ một tài liệu, hãy tạo ra một bộ thẻ học tập (flashcards) gồm tối đa ${limit} thẻ. Mỗi thẻ phải có một mặt trước (câu hỏi hoặc thuật ngữ) và một mặt sau (câu trả lời hoặc định nghĩa). Hãy tập trung vào các khái niệm, định nghĩa quan trọng, và các sự kiện chính. Văn bản trích xuất:\n---\n${full.substring(0, 30000)}\n---\nVui lòng trả về kết quả dưới dạng một mảng JSON. Mỗi đối tượng trong mảng phải có hai thuộc tính: "front" và "back".`;

        const cardSchema = {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING, description: "Mặt trước của thẻ, thường là câu hỏi hoặc thuật ngữ." },
            back: { type: Type.STRING, description: "Mặt sau của thẻ, thường là câu trả lời hoặc định nghĩa." },
          },
          required: ['front', 'back'],
        };

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: cardSchema,
            }
          }
        });

        const jsonText = response.text;
        if (!jsonText) {
          throw new Error("AI không trả về thẻ học tập nào hoặc định dạng không hợp lệ (phản hồi trống).");
        }
        const newCards = JSON.parse(jsonText.trim());

        if (!Array.isArray(newCards) || newCards.length === 0) {
          throw new Error("AI không trả về thẻ học tập nào hoặc định dạng không hợp lệ.");
        }

        const newCardsWithStatus = newCards.map((card: { front: string; back: string; }) => ({ ...card, status: 'new' as const }));
        setCards(newCardsWithStatus.slice(0, limit));
        setStage('cards');
      } catch (geminiError) {
        console.error('Gemini card generation error', geminiError);
        const errorMessage = (geminiError as Error).message || String(geminiError);
        setParseError('Trích văn bản PDF thành công, nhưng không thể tạo thẻ bằng AI. Lỗi: ' + errorMessage);
      }

    } catch (e) {
      console.error('PDF parse error', e);
      const msg = String(e?.message||'');
      if (msg.includes('password-needed')) setParseError('PDF được bảo vệ bằng mật khẩu. Nhập mật khẩu rồi bấm "Tạo thẻ học tập từ PDF" để thử lại.');
      else if (msg.includes('fetch-failed')) setParseError('Không tải được tệp PDF (fetch failed). Kiểm tra mạng/nguồn tệp hoặc tải file về rồi chọn từ máy.');
      else if (msg.includes('no-source')) setParseError('Chưa có nguồn PDF. Vui lòng chọn tệp.');
      else if (msg.includes('pdfjs-cdn-unavailable')) setParseError('Không tải được thư viện pdf.js từ CDN. Kiểm tra kết nối mạng/cơ chế chặn CDN.');
      else if (msg.includes('invalid-pdf')) setParseError('Tệp PDF không hợp lệ hoặc bị hỏng. Hãy thử tệp khác.');
      else if (msg.includes('missing-pdf')) setParseError('Không tìm thấy tệp PDF.');
      else setParseError('Không thể trích văn bản từ PDF. Kiểm tra: (1) file đúng định dạng, (2) không đặt mật khẩu/bị hỏng, (3) kết nối tới CDN hoạt động.');
    } finally {
      setIsParsing(false);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(cards, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'flashcards.json'; a.click(); URL.revokeObjectURL(url);
  };
  const exportCSV = () => {
    const header = 'front,back,status\n';
    const body = cards.map(c => `"${(c.front||'').replace(/\"/g,'\"\"')}","${(c.back||'').replace(/\"/g,'\"\"')}","${c.status}"`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'flashcards.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const useCardsToQuiz = () => {
    let cardPool = cards;
    if (quizFromCardsStrategy === 'needsReview') {
      cardPool = cards.filter(c => c.status === 'needs review');
    } else if (quizFromCardsStrategy === 'notMastered') {
      cardPool = cards.filter(c => c.status !== 'mastered');
    }

    if (cardPool.length === 0) {
      alert('Không có thẻ nào phù hợp để tạo bài kiểm tra. Vui lòng chọn thẻ hoặc thay đổi bộ lọc.');
      return;
    }
    
    const qs = makeMCFromCards(cardPool, Math.min(count, cardPool.length));
    setQuestions(qs); setAnswers({}); setCorrectness([]); setStage('characterSelection');
  };

  const updateCardStatus = (indexToUpdate: number, newStatus: CardStatus) => {
    setCards(currentCards =>
        currentCards.map((card, index) =>
            index === indexToUpdate ? { ...card, status: newStatus } : card
        )
    );
  };

  const handleCardDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent<HTMLLIElement>) => {
      e.preventDefault();
  };

  const handleCardDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) {
          setDraggedIndex(null);
          return;
      }

      const draggedItem = cards[draggedIndex];
      const newCards = [...cards];
      newCards.splice(draggedIndex, 1);
      newCards.splice(dropIndex, 0, draggedItem);

      setCards(newCards);
      setDraggedIndex(null);
  };

  const CardProgress = () => {
    if (cards.length === 0) return null;

    const masteredCount = cards.filter(c => c.status === 'mastered').length;
    const needsReviewCount = cards.filter(c => c.status === 'needs review').length;
    const newCount = cards.filter(c => c.status === 'new').length;
    const totalCount = cards.length;

    const masteredPct = totalCount > 0 ? (masteredCount / totalCount) * 100 : 0;
    const needsReviewPct = totalCount > 0 ? (needsReviewCount / totalCount) * 100 : 0;
    const newPct = totalCount > 0 ? (newCount / totalCount) * 100 : 0;

    return (
      <div className="my-4 p-4 bg-white/10 border border-white/20 rounded-2xl">
        <h3 className="text-sm font-semibold mb-2 opacity-90">Tiến độ học tập</h3>
        <div className="flex h-3 rounded-full overflow-hidden bg-white/10">
          <div 
            className="bg-emerald-400 transition-all duration-300" 
            style={{ width: `${masteredPct}%` }}
            title={`Đã thuộc: ${masteredCount}`}
          ></div>
          <div 
            className="bg-amber-400 transition-all duration-300" 
            style={{ width: `${needsReviewPct}%` }}
            title={`Cần xem lại: ${needsReviewCount}`}
          ></div>
          <div 
            className="bg-slate-400 transition-all duration-300" 
            style={{ width: `${newPct}%` }}
            title={`Mới: ${newCount}`}
          ></div>
        </div>
        <div className="mt-2 grid grid-cols-3 text-xs opacity-80 gap-2">
          <div className="text-center"><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span>Đã thuộc: {masteredCount}</div>
          <div className="text-center"><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5"></span>Xem lại: {needsReviewCount}</div>
          <div className="text-center"><span className="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1.5"></span>Mới: {newCount}</div>
        </div>
      </div>
    );
  };

  const handleAssignQuiz = () => {
    const id = Date.now().toString(36);
    const newAssignment = {
        id,
        topic: topic || "Bài tập không có chủ đề",
        questions,
        createdAt: new Date().toISOString(),
    };
    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    localStorage.setItem('eduquiz:assignments', JSON.stringify(updatedAssignments));
    setAssignmentId(id);
    setStage('share');
  };

  const makeQuizUrl = useCallback(() => {
    if (!assignmentId) return '';
    const base = (typeof location !== 'undefined' && location.origin) ? `${location.origin}${location.pathname}` : '';
    return `${base}?assignment=${assignmentId}`;
  }, [assignmentId]);

  const quizUrl = makeQuizUrl();

  const handleCopyLink = async () => {
    const outcome = await copyTextSafe(quizUrl);
    setCopyStatus(outcome);
    if (outcome !== 'manual') {
        setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleShareLinkCopy = async (url) => {
    const outcome = await copyTextSafe(url);
    setCopyStatus(outcome);
    if (outcome !== 'manual') {
        setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const LearningKitSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-8 bg-slate-700/50 rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-4 bg-slate-700/50 rounded w-1/2 mx-auto mb-6"></div>
        <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="h-5 bg-slate-700/50 rounded w-1/4"></div>
                <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="h-5 bg-slate-700/50 rounded w-2/4"></div>
                <div className="h-4 bg-slate-70-0/50 rounded w-full"></div>
                <div className="h-4 bg-slate-700/50 rounded w-4/5"></div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="h-5 bg-slate-700/50 rounded w-1/3"></div>
                <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
            </div>
        </div>
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <div className="h-12 bg-slate-700/50 rounded-2xl w-56 mx-auto"></div>
        </div>
    </div>
  );
  
    const handleAnswerSelectQuiz = (optionIndex) => {
        if (showFeedback) return;

        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = optionIndex === currentQuestion.a;

        setAnswers(prev => ({ ...prev, [currentQuestion.id]: optionIndex }));
        setSelectedAnswer({ index: optionIndex, isCorrect });
        if (isCorrect) {
            const points = 100 / questions.length;
            setScore(s => s + points);
        }
        setShowFeedback(true);
    };

    const handleNext = () => {
        setShowFeedback(false);
        setSelectedAnswer(null);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
        } else {
            const finalCorrectness = questions.map(q => answers[q.id] === q.a);
            const finalScore = Math.round(score);
            submitQuiz(answers, finalCorrectness, finalScore);
        }
    };

    const handleQuizExit = () => {
        if (confirm("Bạn có chắc muốn thoát? Tiến trình của bạn sẽ không được lưu.")) {
            if (assignmentId) {
                setStage('studentNameEntry');
            } else {
                resetAll();
            }
        }
    };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="relative text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-sm">
            {userRole === 'teacher' ? 'Trợ lý Dạy học Đa năng' : 'Trợ lý Học tập Cá nhân'}
          </h1>
          <p className="opacity-95 mt-2">
             {userRole === 'teacher' ? 'Tạo bộ tài liệu học tập hoàn chỉnh chỉ trong vài giây' : 'Tự tạo bộ đề và thẻ học để chinh phục mọi kiến thức'}
          </p>
        </header>
        
        {stage === 'studentNameEntry' && (
            <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl max-w-lg mx-auto text-center">
                <h2 className="text-2xl font-bold mb-2">Bắt đầu làm bài</h2>
                <p className="opacity-80 mb-6">Chủ đề: {topic}</p>
                <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && studentName) setStage('characterSelection'); }}
                    placeholder="Nhập họ và tên của bạn..."
                    className="w-full text-lg text-center rounded-xl bg-white/15 border border-white/20 p-3 mb-4 placeholder-white/60"
                />
                <button
                    onClick={() => setStage('characterSelection')}
                    disabled={!studentName}
                    className="px-8 py-3 rounded-2xl font-semibold bg-white text-indigo-700 hover:scale-[1.02] active:scale-[.98] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Bắt đầu
                </button>
            </section>
        )}

        {stage === 'builder' && (
          <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl">
            {builderMode === 'choice' && (
                <div className="text-center">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">Bạn muốn tạo gì hôm nay?</h2>
                     {userRole === 'teacher' && (
                        <div className="flex justify-center mb-6">
                            <button
                                onClick={() => setStage('dashboard')}
                                className="px-5 py-2.5 rounded-xl bg-cyan-500/80 hover:bg-cyan-500/100 text-white font-semibold transition"
                            >
                                Bảng điều khiển Lớp học
                            </button>
                        </div>
                     )}
                    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                        <button onClick={() => setBuilderMode('kit')} className="p-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left">
                            <div className="text-4xl mb-2">📚</div>
                            <h3 className="font-bold text-lg">Bộ Tài Liệu Học Tập</h3>
                            <p className="text-sm opacity-80">Tạo tóm tắt, câu hỏi và thẻ học tập từ một chủ đề hoặc hình ảnh.</p>
                        </button>
                        <button onClick={() => setBuilderMode('pdf')} className="p-6 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left">
                            <div className="text-4xl mb-2">🗂️</div>
                            <h3 className="font-bold text-lg">Thẻ học tập từ PDF</h3>
                            <p className="text-sm opacity-80">Tự động trích xuất các khái niệm chính từ tệp PDF để tạo flashcard.</p>
                        </button>
                    </div>
                </div>
            )}

            {builderMode === 'kit' && (
                isGenerating ? (
                    <LearningKitSkeleton />
                ) : (
                    <div>
                         <div className="flex items-center mb-6">
                            <button onClick={() => setBuilderMode('choice')} className="text-sm underline opacity-80 hover:opacity-100 mr-4">← Quay lại</button>
                            <h2 className="text-2xl md:text-3xl font-bold text-center flex-1">Tạo Bộ Tài Liệu Học Tập</h2>
                         </div>
                         <div className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                              <label className="block text-sm mb-2 opacity-90">Dán nội dung bài học, một chủ đề, hoặc tóm tắt từ file Word/PDF…</label>
                              <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={4} placeholder="Ví dụ: Các hành tinh trong hệ Mặt Trời, hoặc dán nội dung tóm tắt..." className="w-full rounded-2xl bg-white/15 border border-white/20 p-4 placeholder-white/60 focus:outline-none focus:ring-4 focus:ring-white/30" />
                              <div className="mt-3">
                                <label className="block text-sm mb-2 opacity-80">Chưa có ý tưởng? Thử một vài gợi ý:</label>
                                <div className="flex flex-wrap gap-2">
                                  {["Lịch sử Việt Nam giai đoạn 1945-1975", "Nguyên lý hoạt động của động cơ đốt trong", "Tóm tắt tác phẩm 'Chí Phèo' của Nam Cao", "Các loại vitamin và vai trò của chúng", "Giải thích hiện tượng hiệu ứng nhà kính"].map((p) => (
                                    <button key={p} onClick={() => setTopic(p)} className="px-3 py-1 text-sm rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-colors">{p}</button>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-white/10 border border-white/20 rounded-2xl">
                                 <label className="cursor-pointer block text-center">
                                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                                    <div className="py-2">
                                      <div className="text-4xl mb-1">🖼️</div>
                                      <div className="font-semibold">Tải lên tệp ảnh</div>
                                      <div className="text-xs opacity-80">(Nội dung ảnh sẽ được dùng để tạo câu hỏi)</div>
                                      {imageName && <div className="mt-1 text-xs opacity-90">Đã chọn: {imageName}</div>}
                                      {imageBase64 && <img src={`data:image/jpeg;base64,${imageBase64}`} alt="Preview" className="mt-2 rounded-lg max-h-32 mx-auto" />}
                                    </div>
                                  </label>
                            </div>
                             <div className="grid grid-cols-1 gap-3">
                                <label className="text-sm opacity-90">Các dạng câu hỏi:</label>
                                {types.map((t, idx) => (
                                  <label key={t.key} className="flex items-center gap-3 bg-white/10 rounded-xl p-3 border border-white/20 hover:bg-white/15">
                                    <input type="checkbox" checked={t.checked} onChange={(e) => setTypes((prev) => prev.map((x, i) => (i === idx ? { ...x, checked: e.target.checked } : x)))} />
                                    <span>{t.label}</span>
                                  </label>
                                ))}
                                <div className="mt-3">
                                  <label className="block text-sm opacity-90 mb-2">Số lượng câu hỏi (1–20):</label>
                                  <input type="text" inputMode="numeric" value={countInput} onChange={(e) => setCountInput(e.target.value.replace(/[^0-9]/g, ''))} onBlur={() => setCount(clamp(Number(countInput) || 1, 1, 20))} className="w-32 rounded-xl bg-white/15 border border-white/20 p-2" />
                                </div>
                            </div>
                         </div>
                         <div className="mt-6 flex flex-col items-center justify-center gap-3">
                            <button onClick={() => runWithApiKey(generateLearningKitWithGemini)} disabled={isGenerating} className="px-6 py-3 rounded-2xl font-semibold bg-white text-indigo-700 hover:scale-[1.02] active:scale-[.98] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                              {isGenerating ? "AI đang tạo..." : "Tạo Bộ Tài Liệu ✨"}
                            </button>
                            {generationError && <div className="text-sm text-rose-300 text-center p-3 bg-rose-900/40 border border-rose-500/50 rounded-lg">{generationError}</div>}
                        </div>
                    </div>
                )
            )}
             {builderMode === 'pdf' && (
                 <div>
                     <div className="flex items-center mb-6">
                        <button onClick={() => setBuilderMode('choice')} className="text-sm underline opacity-80 hover:opacity-100 mr-4">← Quay lại</button>
                        <h2 className="text-2xl md:text-3xl font-bold text-center flex-1">Tạo Thẻ học tập từ PDF</h2>
                     </div>
                     <div className="max-w-md mx-auto">
                        <div className="h-full rounded-2xl bg-white/10 border border-white/20 p-4 flex flex-col gap-4 text-center">
                             <label className="cursor-pointer block">
                                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) {
                                    const url = URL.createObjectURL(f);
                                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                                    setPdfUrl(url); setPdfName(f.name); setPdfFile(f); setParseError(""); setPdfPassword(""); setNeedPassword(false);
                                  } else {
                                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                                    setPdfUrl(''); setPdfName(''); setPdfFile(null); setParseError(""); setPdfPassword(""); setNeedPassword(false);
                                  }
                                }}/>
                                <div className="py-2">
                                  <div className="text-4xl mb-1">📄</div>
                                  <div className="font-semibold">Đính kèm file PDF</div>
                                  <div className="text-xs opacity-80">AI sẽ đọc và trích xuất nội dung để tạo thẻ</div>
                                  {pdfName && (
                                    <div className="mt-2 text-xs">
                                      <div className="opacity-90 truncate">Đã chọn: {pdfName}</div>
                                      {pdfUrl && <a href={pdfUrl} target="_blank" rel="noreferrer" className="underline">Mở PDF</a>}
                                    </div>
                                  )}
                                  <div className="mt-3 flex flex-col gap-2">
                                    {needPassword && (
                                      <div className="flex items-center gap-2">
                                        <input type="password" value={pdfPassword} onChange={(e)=>setPdfPassword(e.target.value)} placeholder="Nhập mật khẩu PDF" className="flex-1 rounded-xl bg-white/15 border border-white/30 p-2 text-white placeholder-white/60"/>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                      <label className="text-xs opacity-90">Số thẻ tạo (1–20):</label>
                                      <input type="range" min={1} max={20} value={pdfCardCount} onChange={(e)=>setPdfCardCount(Number(e.target.value))} />
                                      <div className="text-xs">{pdfCardCount}</div>
                                    </div>
                                    <button disabled={!pdfUrl || isParsing} onClick={() => runWithApiKey(parsePdfToCards)} className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold disabled:opacity-60">
                                      {isParsing ? 'Đang xử lý PDF & AI...' : 'Bắt đầu tạo thẻ'}
                                    </button>
                                    {parseError && <div className="text-left text-xs text-rose-200 bg-rose-900/30 border border-rose-400/40 rounded-lg p-2">{parseError}</div>}
                                  </div>
                                </div>
                              </label>
                        </div>
                     </div>
                 </div>
            )}
          </section>
        )}

        {stage === 'learningKit' && learningKit && (
          <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-1">Bộ Tài Liệu Học Tập Của Bạn</h2>
              <p className="text-center text-sm opacity-80 mb-6">Chủ đề: <span className="font-semibold">{topic || pdfName}</span></p>

              <div className="grid md:grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto pr-2">
                  <div className="md:col-span-2 bg-white/10 border border-white/20 rounded-2xl p-5">
                      <h3 className="font-bold text-lg mb-2 text-cyan-300">📝 Tóm tắt ý chính</h3>
                      <p className="whitespace-pre-wrap opacity-90 leading-relaxed">{learningKit.summary}</p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-5">
                      <h3 className="font-bold text-lg mb-2 text-amber-300">🤔 Câu hỏi Tư duy Phản biện</h3>
                      <p className="opacity-90">{learningKit.criticalThinkingQuestion}</p>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                      <h3 className="font-bold text-lg mb-2 text-emerald-300">🗂️ Thẻ học tập ({cards.length})</h3>
                      <p className="text-sm opacity-80">Sử dụng thẻ để ghi nhớ các thuật ngữ và khái niệm quan trọng.</p>
                  </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                  <h3 className="text-xl font-bold">Bạn muốn làm gì tiếp theo?</h3>
                  <p className="opacity-80 mb-4">Kiểm tra kiến thức, học với thẻ, hoặc tinh chỉnh lại bộ tài liệu cho hoàn hảo.</p>
                  <div className="flex justify-center items-center flex-wrap gap-4">
                        <button onClick={() => setStage('review')} className="px-6 py-3 rounded-2xl font-semibold bg-white/20 border border-white/30 hover:bg-white/30 transition">
                            Chỉnh sửa & Tùy chỉnh
                        </button>
                        <button onClick={() => setStage('cards')} className="px-6 py-3 rounded-2xl font-semibold bg-emerald-500/80 hover:bg-emerald-500/100 text-white transition">
                            Học với Thẻ
                        </button>
                        <button onClick={() => setStage('characterSelection')} className="px-8 py-4 text-lg rounded-2xl font-semibold bg-white text-indigo-700 hover:scale-[1.02] active:scale-[.98] transition shadow-lg">
                            Bắt đầu làm bài
                        </button>
                  </div>
                  <button onClick={resetAll} className="mt-6 text-sm underline opacity-80 hover:opacity-100 block mx-auto">
                      Tạo bộ tài liệu khác
                  </button>
              </div>
          </section>
        )}

        {stage === 'review' && learningKit && (
            <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl max-w-4xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-1">Kiểm tra & Tinh chỉnh Toàn bộ Bộ Tài Liệu</h2>
                <p className="text-center text-sm opacity-80 mb-6">Chỉnh sửa mọi thứ AI đã tạo để phù hợp hoàn hảo với bài giảng của bạn.</p>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="bg-white/5 border border-white/15 rounded-2xl p-4">
                        <h3 className="font-bold text-lg mb-2 text-cyan-300">📝 Tóm tắt ý chính</h3>
                        <textarea
                            value={learningKit.summary}
                            onChange={(e) => {
                                const newSummary = e.target.value;
                                setLearningKit(prev => prev ? { ...prev, summary: newSummary } : null);
                            }}
                            className="w-full min-h-[100px] rounded-xl bg-white/15 border border-white/20 p-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                    </div>
                    
                     <div className="bg-white/5 border border-white/15 rounded-2xl p-4">
                        <h3 className="font-bold text-lg mb-2 text-amber-300">🤔 Câu hỏi Tư duy Phản biện</h3>
                        <textarea
                            value={learningKit.criticalThinkingQuestion}
                             onChange={(e) => {
                                const newCtq = e.target.value;
                                setLearningKit(prev => prev ? { ...prev, criticalThinkingQuestion: newCtq } : null);
                            }}
                            className="w-full rounded-xl bg-white/15 border border-white/20 p-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                    </div>

                    <div className="bg-white/5 border border-white/15 rounded-2xl p-4">
                        <h3 className="font-bold text-lg mb-3 text-emerald-300">🗂️ Thẻ học tập ({cards.length})</h3>
                        <ul className="space-y-2">
                            {cards.map((card, idx) => (
                                <li key={`card-edit-${idx}`} className="flex items-start gap-2 bg-white/10 p-2 rounded-lg">
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <textarea
                                            value={card.front}
                                            onChange={(e) => {
                                                const newFront = e.target.value;
                                                setCards(prev => prev.map((c, i) => i === idx ? { ...c, front: newFront } : c));
                                            }}
                                            placeholder="Mặt trước..."
                                            className="min-h-[60px] w-full text-sm resize-y rounded-md bg-white/15 border border-white/20 p-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                                        />
                                        <textarea
                                            value={card.back}
                                             onChange={(e) => {
                                                const newBack = e.target.value;
                                                setCards(prev => prev.map((c, i) => i === idx ? { ...c, back: newBack } : c));
                                            }}
                                            placeholder="Mặt sau..."
                                            className="min-h-[60px] w-full text-sm resize-y rounded-md bg-white/15 border border-white/20 p-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
                                        />
                                    </div>
                                    <button onClick={() => {
                                        if (confirm('Bạn có chắc muốn xóa thẻ này?')) {
                                            setCards(prev => prev.filter((_, i) => i !== idx));
                                        }
                                    }} className="px-3 py-2 mt-1 rounded-lg bg-white/10 hover:bg-rose-500/50 transition-colors">🗑️</button>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setCards(prev => [...prev, { front: 'Mặt trước mới', back: 'Mặt sau mới', status: 'new' }])} className="w-full mt-3 py-2 text-sm rounded-lg bg-white/15 border border-white/25 hover:bg-white/20 transition">
                            + Thêm Thẻ Mới
                        </button>
                    </div>

                    <div className="bg-white/5 border border-white/15 rounded-2xl p-4">
                        <h3 className="font-bold text-lg mb-3 text-purple-300">❓ Câu hỏi ôn tập ({questions.length})</h3>
                        <ul className="space-y-3">
                          {questions.map((q, idx) => (
                            <li key={q.id} className="rounded-xl p-3 bg-white/10">
                              <div className="flex items-start gap-3">
                                <div className="text-sm opacity-80 min-w-[54px] mt-1">Câu {idx + 1}</div>
                                <div className="flex-1 space-y-2">
                                  <input className="w-full rounded-xl bg-white/15 border border-white/20 p-2" value={q.q} onChange={(e)=>{
                                    const v=e.target.value; setQuestions(arr=>arr.map((x,i)=> i===idx?{...x,q:v}:x));
                                  }} />
                                  {q.type==='mc' && (
                                    <div className="grid md:grid-cols-2 gap-2">
                                      {(q.opts || []).map((opt,i)=>(
                                        <div key={i} className="flex items-center gap-2">
                                          <input className="flex-1 rounded-xl bg-white/15 border border-white/20 p-2" value={opt} onChange={(e)=>{
                                            const v=e.target.value; setQuestions(arr=>arr.map((x,ii)=> ii===idx?{...x,opts:(x.opts || []).map((o,oi)=> oi===i?v:o)}:x));
                                          }} />
                                          <label className="flex items-center gap-1 text-xs"><input type="radio" checked={q.a===i} onChange={()=>setQuestions(arr=>arr.map((x,ii)=> ii===idx?{...x,a:i}:x))} /> Đúng</label>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {q.type==='tf' && (
                                    <div className="text-xs opacity-85">Dạng Đúng/Sai – đáp án hiện tại: <b>{String(q.a)}</b></div>
                                  )}
                                  {q.type==='fill' && (
                                    <div className="text-xs opacity-85">Đáp án: <input className="ml-2 rounded bg-white/15 border border-white/20 p-1" value={q.a||''} onChange={(e)=>setQuestions(arr=>arr.map((x,i)=> i===idx?{...x,a:e.target.value}:x))} /></div>
                                  )}
                                   {q.type==='short' && (
                                    <div className="text-xs opacity-85">Câu hỏi mở, không cần đáp án mẫu.</div>
                                  )}
                                   <textarea
                                        className="w-full text-sm rounded-xl bg-white/15 border border-white/20 p-2 mt-2 placeholder-white/60"
                                        placeholder="Thêm hoặc sửa giải thích..."
                                        value={q.explanation || ''}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setQuestions(arr => arr.map((x, i) => i === idx ? { ...x, explanation: v } : x));
                                        }}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button className="px-3 py-2 rounded-xl bg-white/20 border border-white/30 hover:bg-rose-500/50" onClick={()=>{
                                    const ok = confirm('Xóa câu này?');
                                    if(ok) setQuestions(arr=>arr.filter((_,i)=>i!==idx));
                                  }}>🗑️</button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <button className="w-full mt-3 py-2 text-sm rounded-lg bg-white/15 border border-white/25 hover:bg-white/20 transition" onClick={()=>{
                            setQuestions(arr=>[...arr,{ id: (arr[arr.length - 1]?.id||0)+1, type:'mc', q:'Câu hỏi mới', opts:['Lựa chọn 1','Lựa chọn 2','Lựa chọn 3','Lựa chọn 4'], a:0, explanation: '' }]);
                          }}>+ Thêm Câu Hỏi Mới</button>
                    </div>
                </div>

                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={()=>setStage('learningKit')} className="px-6 py-3 rounded-2xl font-semibold bg-white/20 border border-white/30">Quay lại</button>
                  <button onClick={() => setStage('characterSelection')} className="px-6 py-3 rounded-2xl font-semibold bg-white text-indigo-700">Làm bài thử</button>
                  {userRole === 'teacher' && (
                    <button onClick={handleAssignQuiz} className="px-6 py-3 rounded-2xl font-semibold bg-emerald-400 text-emerald-950 hover:scale-[1.02] active:scale-[.98] transition shadow-lg">
                        Giao Bài & Lấy Link
                    </button>
                  )}
                </div>
            </section>
        )}

        {stage === 'share' && (
          <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-2">Đã Giao Bài Thành Công!</h2>
            <p className="opacity-80 mb-6">Sao chép và gửi liên kết bên dưới cho học sinh để bắt đầu làm bài.</p>
            
            <div className="bg-white/10 border border-white/20 rounded-2xl p-2 flex items-center justify-between mb-6">
                <input 
                    readOnly 
                    value={quizUrl}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-transparent outline-none text-white/90 px-3 truncate"
                    aria-label="Link bài kiểm tra"
                />
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-4">
                <button
                    onClick={handleCopyLink}
                    className="px-6 py-3 rounded-2xl font-semibold bg-green-500 text-white hover:scale-[1.02] active:scale-[.98] transition shadow-lg"
                >
                    {copyStatus === 'success' || copyStatus === 'fallback' ? 'Đã Sao Chép Link ✅' : 'Sao Chép Link'}
                </button>
                <a
                    href={quizUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-2xl font-semibold bg-yellow-500 text-yellow-950 hover:scale-[1.02] active:scale-[.98] transition shadow-lg inline-block"
                >
                    Xem trước bài làm
                </a>
            </div>
            
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => setStage('dashboard')} className="text-sm underline opacity-80 hover:opacity-100">
                Xem Bảng điều khiển
              </button>
              <button onClick={() => setStage('builder')} className="text-sm underline opacity-80 hover:opacity-100">
                Tạo bài giao khác
              </button>
            </div>

          </section>
        )}
        
        {stage === 'dashboard' && (
            <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold">Bảng điều khiển Lớp học</h2>
                    <button onClick={() => setStage('builder')} className="text-sm underline opacity-80 hover:opacity-100">
                        ← Tạo bài mới
                    </button>
                </div>
                {assignments.length === 0 ? (
                    <p className="text-center opacity-80">Chưa có bài nào được giao. Hãy tạo một bộ tài liệu và giao bài nhé.</p>
                ) : (
                    <ul className="space-y-3">
                        {assignments.map(assignment => {
                            const submissionCount = submissions[assignment.id]?.length || 0;
                            return (
                                <li key={assignment.id} className="bg-white/10 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold">{assignment.topic}</h3>
                                        <p className="text-xs opacity-70">Giao lúc: {new Date(assignment.createdAt).toLocaleString('vi-VN')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{submissionCount} bài nộp</p>
                                        <button onClick={() => { setViewingAssignment(assignment); setStage('assignmentDetail'); }} className="text-sm text-cyan-300 underline">
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        )}

        {stage === 'assignmentDetail' && viewingAssignment && (
            <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Chi tiết: {viewingAssignment.topic}</h2>
                    <button onClick={() => setStage('dashboard')} className="text-sm underline opacity-80 hover:opacity-100">
                        ← Về Bảng điều khiển
                    </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 p-4 rounded-xl border border-white/15">
                        <h3 className="font-semibold mb-3">Danh sách nộp bài</h3>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {(submissions[viewingAssignment.id] || []).length > 0 ? (
                                submissions[viewingAssignment.id].map((sub, index) => (
                                    <li key={index} className="flex justify-between items-center bg-white/10 p-2 rounded-lg text-sm">
                                        <span>{sub.studentName}</span>
                                        <span className={`font-bold ${sub.score >= 70 ? 'text-green-300' : 'text-yellow-300'}`}>{sub.score}/100</span>
                                    </li>
                                ))
                            ) : (
                                <p className="text-sm opacity-70">Chưa có học sinh nào nộp bài.</p>
                            )}
                        </ul>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/15">
                        <h3 className="font-semibold mb-3">Phân tích câu hỏi</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {(() => {
                                const assignmentSubmissions = submissions[viewingAssignment.id] || [];
                                if (assignmentSubmissions.length === 0) {
                                    return <p className="text-sm opacity-70">Chưa có dữ liệu để phân tích.</p>;
                                }

                                const questionStats = viewingAssignment.questions.map(q => ({
                                    ...q,
                                    incorrectCount: 0,
                                }));

                                assignmentSubmissions.forEach(sub => {
                                    sub.correctness.forEach((isCorrect, index) => {
                                        if (!isCorrect && questionStats[index]) {
                                            questionStats[index].incorrectCount++;
                                        }
                                    });
                                });

                                const sortedStats = questionStats.sort((a, b) => b.incorrectCount - a.incorrectCount);

                                return sortedStats.slice(0, 5).map((stat, index) => (
                                    stat.incorrectCount > 0 && (
                                        <div key={index} className="bg-white/10 p-2 rounded-lg text-sm">
                                            <p className="font-semibold truncate">{stat.q}</p>
                                            <p className="text-rose-300">{stat.incorrectCount} học sinh ({Math.round((stat.incorrectCount / assignmentSubmissions.length) * 100)}%) trả lời sai.</p>
                                        </div>
                                    )
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            </section>
        )}


        {stage === 'cards' && (
          <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Thẻ học tập ({cards.length})</h2>
              <button onClick={() => learningKit ? setStage('learningKit') : resetAll()} className="text-sm underline opacity-90">← Trở về</button>
            </div>
            {pdfUrl && (
              <div className="mb-6 bg-white/10 border border-white/20 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 text-sm bg-white/10">
                  <span className="opacity-90">Từ tài liệu: {pdfName}</span>
                  <a className="underline" href={pdfUrl} target="_blank" rel="noreferrer">Mở trong tab mới</a>
                </div>
                <PdfPreview url={pdfUrl} name={pdfName} />
              </div>
            )}

            {cards.length === 0 ? (
              <div className="opacity-90">Không có thẻ học tập. Hãy tạo một bộ tài liệu mới.</div>
            ) : (
              <>
                <CardProgress />
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm opacity-90">Lọc:</span>
                  <button onClick={() => setCardFilter('all')} className={`px-3 py-1 rounded-lg text-sm ${cardFilter === 'all' ? 'bg-white text-indigo-700 font-semibold' : 'bg-white/10'}`}>Tất cả</button>
                  <button onClick={() => setCardFilter('needsReview')} className={`px-3 py-1 rounded-lg text-sm ${cardFilter === 'needsReview' ? 'bg-white text-indigo-700 font-semibold' : 'bg-white/10'}`}>Cần xem lại</button>
                  <button onClick={() => setCardFilter('notMastered')} className={`px-3 py-1 rounded-lg text-sm ${cardFilter === 'notMastered' ? 'bg-white text-indigo-700 font-semibold' : 'bg-white/10'}`}>Chưa thuộc</button>
                </div>

                <ul className="space-y-3 max-h-[50vh] overflow-auto pr-2">
                  {cards.map((c, idx) => {
                    const shouldShow =
                      cardFilter === 'all' ||
                      (cardFilter === 'needsReview' && c.status === 'needs review') ||
                      (cardFilter === 'notMastered' && c.status !== 'mastered');
                    if (!shouldShow) return null;

                    const statusIndicatorClasses = {
                        'new': 'bg-slate-400',
                        'mastered': 'bg-emerald-400',
                        'needs review': 'bg-amber-400',
                    }[c.status];

                    const isBeingDraggedOver = draggedIndex !== null && draggedIndex !== idx;

                    return (
                      <li key={idx}
                        draggable
                        onDragStart={(e) => handleCardDragStart(e, idx)}
                        onDragOver={handleCardDragOver}
                        onDrop={(e) => handleCardDrop(e, idx)}
                        onDragEnd={() => setDraggedIndex(null)}
                        className={`relative flex items-start gap-3 p-3 transition-all duration-200 rounded-xl border bg-white/10 cursor-grab ${draggedIndex === idx ? 'opacity-40 scale-[0.98]' : 'opacity-100'} ${isBeingDraggedOver ? 'border-dashed border-white/60 bg-white/20' : 'border-transparent'}`}>
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${statusIndicatorClasses}`}></div>
                        <div className="flex-1 pl-2">
                          <div className="grid md:grid-cols-2 gap-3">
                            <textarea value={c.front} onChange={(e)=>{ const v=e.target.value; setCards((arr)=>arr.map((x,i)=> i===idx?{...x,front:v}:x)); }} placeholder="Mặt trước..." className="min-h-[70px] resize-y rounded-lg bg-white/15 border border-white/20 p-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40" />
                            <textarea value={c.back} onChange={(e)=>{ const v=e.target.value; setCards((arr)=>arr.map((x,i)=> i===idx?{...x,back:v}:x)); }} placeholder="Mặt sau..." className="min-h-[70px] resize-y rounded-lg bg-white/15 border border-white/20 p-2 placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => updateCardStatus(idx, 'mastered')} title="Đã thuộc" className={`p-2 text-lg rounded-full transition ${c.status === 'mastered' ? 'bg-emerald-500/50' : 'bg-white/10 hover:bg-white/20'}`}>✅</button>
                          <button onClick={() => updateCardStatus(idx, 'needs review')} title="Cần xem lại" className={`p-2 text-lg rounded-full transition ${c.status === 'needs review' ? 'bg-amber-500/50' : 'bg-white/10 hover:bg-white/20'}`}>🚩</button>
                          <button onClick={() => updateCardStatus(idx, 'new')} title="Đặt lại" className={`p-2 text-lg rounded-full transition ${c.status === 'new' ? 'bg-slate-500/50' : 'bg-white/10 hover:bg-white/20'}`}>🔄</button>
                           <button 
                                onClick={() => {
                                    const cardData = btoa(JSON.stringify({ front: c.front, back: c.back }));
                                    const url = `${window.location.origin}${window.location.pathname}?shared_card=${cardData}`;
                                    setShareModalContent({ title: 'Share this Card', url });
                                    setCopyStatus('idle');
                                }} 
                                title="Share Card" 
                                className="p-2 text-lg rounded-full bg-white/10 hover:bg-white/20 transition"
                              >
                                🔗
                              </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={exportJSON} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 font-semibold">Xuất JSON</button>
                  <button onClick={exportCSV} className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 font-semibold">Xuất CSV</button>
                   <button
                        onClick={() => {
                            const setData = btoa(JSON.stringify(cards.map(({ front, back }) => ({ front, back }))));
                            const url = `${window.location.origin}${window.location.pathname}?shared_set=${setData}`;
                            setShareModalContent({ title: 'Share this Study Set', url });
                            setCopyStatus('idle');
                        }}
                        className="px-4 py-2 rounded-xl bg-cyan-500/80 border border-cyan-400/50 text-white font-semibold transition hover:scale-[1.02] active:scale-[.98]"
                    >
                        Chia sẻ bộ thẻ
                    </button>
                  <button
                    onClick={() => {
                      localStorage.setItem('eduquiz:saved_cards', JSON.stringify(cards));
                      setSaveStatus('saved');
                      setTimeout(() => setSaveStatus('idle'), 2000);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500/80 border border-emerald-400/50 font-semibold transition hover:scale-[1.02] active:scale-[.98]"
                  >
                    {saveStatus === 'saved' ? 'Đã lưu ✅' : 'Lưu để học sau'}
                  </button>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-white/15 border border-white/25">
                  <h3 className="font-bold text-lg mb-3">Tạo bài kiểm tra từ các thẻ này</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center gap-2">
                          <input type="radio" name="quizStrategy" value="notMastered" checked={quizFromCardsStrategy === 'notMastered'} onChange={(e) => setQuizFromCardsStrategy(e.target.value as any)} />
                          <span>Thẻ chưa thuộc</span>
                      </label>
                      <label className="flex items-center gap-2">
                          <input type="radio" name="quizStrategy" value="needsReview" checked={quizFromCardsStrategy === 'needsReview'} onChange={(e) => setQuizFromCardsStrategy(e.target.value as any)} />
                          <span>Thẻ cần xem lại</span>
                      </label>
                      <label className="flex items-center gap-2">
                          <input type="radio" name="quizStrategy" value="all" checked={quizFromCardsStrategy === 'all'} onChange={(e) => setQuizFromCardsStrategy(e.target.value as any)} />
                          <span>Tất cả thẻ</span>
                      </label>
                  </div>
                  <button onClick={useCardsToQuiz} className="mt-4 px-4 py-2 rounded-xl bg-white text-indigo-700 font-semibold">Dùng thẻ để tạo bài trắc nghiệm</button>
                </div>
              </>
            )}
          </section>
        )}
        
        {stage === 'characterSelection' && (
          <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2">Chọn Nhân Vật Đồng Hành</h2>
            <p className="text-center opacity-80 mb-8">Ai sẽ cùng em chinh phục thử thách tri thức này?</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {CHARACTERS.map(char => (
                <button 
                  key={char.name}
                  onClick={() => setSelectedCharacter(char)}
                  className={`p-4 rounded-2xl text-center transition-all duration-200 border-2 
                    ${selectedCharacter?.name === char.name 
                      ? 'bg-white/20 border-white scale-105' 
                      : 'bg-white/10 border-transparent hover:bg-white/15'}`}
                >
                  <div className="bg-white/10 rounded-xl p-2 h-24 w-24 mx-auto flex items-center justify-center mb-3">
                    <img src={char.image} alt={char.name} className="h-16 w-16" />
                  </div>
                  <p className="font-semibold text-sm">{char.name}</p>
                </button>
              ))}
            </div>

            <div className="text-center">
              <button 
                onClick={() => {
                  setAnswers({});
                  setCorrectness([]);
                  setCurrentQuestionIndex(0);
                  setScore(0);
                  setSelectedAnswer(null);
                  setShowFeedback(false);
                  setStage('quiz');
                }} 
                disabled={!selectedCharacter}
                className="px-8 py-3 rounded-2xl font-semibold bg-white text-indigo-700 hover:scale-[1.02] active:scale-[.98] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bắt Đầu Chơi
              </button>
            </div>
          </section>
        )}

        {stage === 'quiz' && questions.length > 0 && selectedCharacter && (() => {
                const currentQuestion = questions[currentQuestionIndex];
                return (
                    <section className="backdrop-blur-xl bg-black/20 border-2 border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-[0_0_25px_rgba(192,132,252,0.2)] max-w-4xl mx-auto animate-fade-in">
                        <header className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/10 rounded-full p-1 border-2 border-white/20">
                                    <img src={selectedCharacter.image} alt={selectedCharacter.name} />
                                </div>
                                <div>
                                    <button onClick={handleQuizExit} className="text-sm underline opacity-80 hover:opacity-100">Thoát</button>
                                    <div className="font-bold text-lg text-purple-200">{studentName || selectedCharacter.name}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-lg text-yellow-300">Điểm: {Math.round(score)}</div>
                                <div className="text-sm opacity-80">Câu hỏi: {currentQuestionIndex + 1} / {questions.length}</div>
                            </div>
                        </header>

                        <div className="w-full bg-white/20 rounded-full h-2.5 mb-6">
                            <div className="bg-green-400 h-2.5 rounded-full transition-all duration-300" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                        </div>

                        <div className="text-center">
                            <h2 className="text-xl md:text-2xl font-semibold mb-8 min-h-[6rem] flex items-center justify-center p-4 bg-black/30 rounded-2xl">{currentQuestion.q}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(currentQuestion.opts || []).map((opt, i) => {
                                    let borderColor = 'border-purple-400/50';
                                    let bgColor = 'bg-black/40 hover:bg-black/60';
                                    if (showFeedback) {
                                        if (i === currentQuestion.a) {
                                            borderColor = 'border-green-400';
                                            bgColor = 'bg-green-800/50';
                                        } else if (selectedAnswer?.index === i) {
                                            borderColor = 'border-red-500';
                                            bgColor = 'bg-red-800/50';
                                        } else {
                                            borderColor = 'border-transparent opacity-60';
                                        }
                                    }
                                    return (
                                        <button 
                                            key={i} 
                                            onClick={() => handleAnswerSelectQuiz(i)} 
                                            disabled={showFeedback} 
                                            className={`text-left text-lg flex items-center gap-4 rounded-xl p-4 border-4 transition-all disabled:cursor-not-allowed ${bgColor} ${borderColor}`}
                                        >
                                            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-black/40 flex items-center justify-center font-bold">{String.fromCharCode(65 + i)}</div>
                                            <span className="flex-1">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {showFeedback && (
                                <div className={`mt-6 p-4 rounded-2xl text-left border-2 animate-fade-in ${selectedAnswer?.isCorrect ? 'bg-green-900/40 border-green-500/50' : 'bg-red-900/40 border-red-500/50'}`}>
                                    <h3 className="font-bold text-xl mb-2">{selectedAnswer?.isCorrect ? 'Chính xác! 🥳' : 'Chưa đúng rồi... 🤔'}</h3>
                                    {!selectedAnswer?.isCorrect && <p className="mb-2">Đáp án đúng là: <b>{(currentQuestion.opts || [])[currentQuestion.a]}</b></p>}
                                    <p className="text-sm opacity-90">{currentQuestion.explanation}</p>
                                    <button onClick={handleNext} className="w-full mt-4 px-6 py-3 rounded-xl bg-white text-indigo-700 font-semibold text-lg hover:scale-[1.02] active:scale-[0.98] transition">
                                        {currentQuestionIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                )
            })()}

        {stage === 'result' && result && (
          <section className="backdrop-blur-xl bg-white/10 border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="mt-3 text-3xl font-extrabold">{result.score >= 70 ? "Hoàn thành tốt!" : "Cố Gắng Hơn Nhé!"}</h2>
              {studentName && <p className="opacity-80 mt-1">Cảm ơn {studentName} đã hoàn thành bài làm.</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-white/10 p-4 border border-white/20"><div className="text-xs opacity-80">ĐIỂM SỐ</div><div className="text-3xl font-extrabold mt-1">{result.score}<span className="text-base">/100</span></div></div>
                  <div className="rounded-xl bg-white/10 p-4 border border-white/20"><div className="text-xs opacity-80">TRẢ LỜI ĐÚNG</div><div className="text-3xl font-extrabold mt-1">{correctness.filter(Boolean).length}/{questions.length}</div></div>
                  <div className="rounded-xl bg-white/10 p-4 border border-white/20"><div className="text-xs opacity-80">CHUỖI DÀI NHẤT</div><div className="text-3xl font-extrabold mt-1">🔥 {result.streak}</div></div>
                </div>
              </div>

              <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
                  <h3 className="text-xl font-bold mb-3">{geminiFeedback.title || "Nhận xét"}</h3>
                  <p className="whitespace-pre-wrap opacity-90 leading-relaxed">{geminiFeedback.body || (assignmentId ? 'Kết quả của bạn đã được ghi lại.' : 'Đang tải...')}</p>
              </div>
            </div>

             <div className="mt-8 flex justify-center gap-4">
                {!assignmentId ? (
                    <button onClick={resetAll} className="px-8 py-3 rounded-2xl font-semibold bg-white text-indigo-700 hover:scale-[1.02] active:scale-[.98] transition shadow-lg">
                      Tạo bộ tài liệu mới
                    </button>
                ) : (
                    <p className="text-center opacity-80">Bạn có thể đóng cửa sổ này.</p>
                )}
             </div>
          </section>
        )}
        {shareModalContent && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShareModalContent(null)}>
                <div className="bg-slate-800/80 border-2 border-cyan-400 rounded-3xl p-6 w-full max-w-lg shadow-[0_0_25px_rgba(34,211,238,0.5)]" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold mb-4">{shareModalContent.title}</h3>
                        <button onClick={() => setShareModalContent(null)} className="text-2xl opacity-70 hover:opacity-100">&times;</button>
                    </div>
                    <p className="text-sm opacity-80 mb-4">Sao chép và chia sẻ liên kết này với bất kỳ ai. Họ có thể xem mà không cần tài khoản.</p>
                    <div className="bg-black/40 border border-white/20 rounded-lg p-2 flex items-center justify-between mb-4">
                        <input 
                            readOnly 
                            value={shareModalContent.url}
                            onFocus={(e) => e.target.select()}
                            className="w-full bg-transparent outline-none text-white/90 px-2 truncate"
                            aria-label="Shareable link"
                        />
                    </div>
                    <button
                        onClick={() => handleShareLinkCopy(shareModalContent.url)}
                        className="w-full py-2.5 rounded-lg bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400 transition"
                    >
                        {copyStatus === 'success' || copyStatus === 'fallback' ? 'Đã sao chép vào Clipboard! ✅' : 'Sao chép liên kết'}
                    </button>
                    <div className="mt-4 pt-4 border-t border-white/20 text-center">
                        <p className="text-sm opacity-80 mb-3">Hoặc chia sẻ trực tiếp:</p>
                        <div className="flex justify-center gap-4">
                            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareModalContent.url)}&text=${encodeURIComponent('Hãy xem bộ thẻ học tập này tôi đã tạo!')}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 transition">
                                X / Twitter
                            </a>
                            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareModalContent.url)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 transition">
                                Facebook
                            </a>
                            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Hãy xem bộ thẻ học tập này tôi đã tạo! ' + shareModalContent.url)}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 transition">
                                WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
