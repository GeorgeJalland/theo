export default function Panel({
    children,
    className = "",
}) {
    return (
        <div
            className={[
                "flex gap-2 items-center justify-center backdrop-blur-sm",
                "border border-white/30 bg-white/5 rounded-xl p-2",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
}