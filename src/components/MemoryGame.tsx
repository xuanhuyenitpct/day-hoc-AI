import React, { useState, useEffect, useMemo, useCallback } from "react";

export const MemoryGame = ({ onClose }) => {
    const EMOJIS = useMemo(() => ['🌳', '🎋', '🏮', '🐔', '💧', '🌾'], []);

    const createShuffledCards = useCallback(() => {
        return [...EMOJIS, ...EMOJIS]
            .map((emoji, index) => ({ id: index, emoji, isFlipped: false, isMatched: false }))
            .sort(() => Math.random() - 0.5);
    }, [EMOJIS]);

    const [cards, setCards] = useState(createShuffledCards);
    const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
    const [turns, setTurns] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [isGameOver, setIsGameOver] = useState(false);

    useEffect(() => {
        if (flippedIndices.length === 2) {
            setIsChecking(true);
            const [firstIndex, secondIndex] = flippedIndices;
            const firstCard = cards[firstIndex];
            const secondCard = cards[secondIndex];

            if (firstCard.emoji === secondCard.emoji) {
                setCards(prevCards =>
                    prevCards.map(card =>
                        card.emoji === firstCard.emoji ? { ...card, isMatched: true } : card
                    )
                );
                setFlippedIndices([]);
                setIsChecking(false);
            } else {
                setTimeout(() => {
                    setCards(prevCards =>
                        prevCards.map((card, index) =>
                            index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
                        )
                    );
                    setFlippedIndices([]);
                    setIsChecking(false);
                }, 1000);
            }
            setTurns(t => t + 1);
        }
    }, [flippedIndices, cards]);

    useEffect(() => {
        const matchedCount = cards.filter(card => card.isMatched).length;
        if (matchedCount === cards.length && cards.length > 0) {
            setIsGameOver(true);
        }
    }, [cards]);

    const handleCardClick = (index: number) => {
        if (isChecking || cards[index].isFlipped || flippedIndices.length >= 2) {
            return;
        }

        setCards(prevCards =>
            prevCards.map((card, i) =>
                i === index ? { ...card, isFlipped: true } : card
            )
        );
        setFlippedIndices(prev => [...prev, index]);
    };
    
    const resetGame = () => {
        setCards(createShuffledCards());
        setFlippedIndices([]);
        setTurns(0);
        setIsChecking(false);
        setIsGameOver(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div
                className="relative bg-[#fdf6ec] text-[#5c3e3e] rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border-4 border-white/30"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl opacity-70 hover:opacity-100">&times;</button>
                <header className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">🧠</div>
                    <h2 className="text-2xl font-bold text-[#4a2e2e]">Trò chơi trí nhớ</h2>
                </header>
                <p className="mb-2">Tìm các cặp giống nhau</p>
                <p className="mb-4 font-semibold">Lượt: {turns}</p>
                
                {isGameOver ? (
                    <div className="text-center py-10">
                        <h3 className="text-3xl font-bold mb-2">Tuyệt vời!</h3>
                        <p className="mb-4">Bạn đã hoàn thành trong {turns} lượt.</p>
                        <button onClick={resetGame} className="px-6 py-3 rounded-xl bg-[#4a2e2e] text-white font-semibold">
                            Chơi lại
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-3">
                        {cards.map((card, index) => (
                            <button
                                key={card.id}
                                onClick={() => handleCardClick(index)}
                                disabled={card.isFlipped || card.isMatched}
                                className={`w-full aspect-square rounded-2xl flex items-center justify-center text-4xl transition-transform duration-300 ${
                                    card.isFlipped || card.isMatched
                                        ? 'bg-yellow-200/80'
                                        : 'bg-[#d0e0ff] hover:bg-[#c0d4ff] border-2 border-[#a8c3ff] shadow-inner'
                                } ${card.isMatched ? 'opacity-50' : ''}`}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                <div className="absolute backface-hidden" style={{transform: 'rotateY(0deg)'}}>
                                    {card.isFlipped || card.isMatched ? card.emoji : <span className="text-[#3c3a79]">?</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
