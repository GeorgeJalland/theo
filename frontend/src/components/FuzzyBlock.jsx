export default function FuzzyBlock({ children, className }) {
    return (
        <div className={`bg-white/5 border border-white/10 rounded-xl p-5 backdrop-blur-sm shadow-lg ${className}`}>
            {children}
        </div>
    );
}