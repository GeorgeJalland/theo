export default function Reference({ url }) {
    return (
        <a
            className="quoteReference flex items-center"
            href={url}
        >
            [reference]
        </a>
    )
}