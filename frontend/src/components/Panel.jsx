export default function Panel({
    children,
    className = "",
}) {
    return (
        <div
            className={[
                "flex gap-2 items-center justify-center",
                "border border-white/30 bg-black/10 rounded-xl p-2",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
}