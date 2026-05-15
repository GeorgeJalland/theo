# Quote Extractor
Extract and match quotes from YouTube comments to podcast episode transcripts.

## Usage Example

```python
python main.py --source --process --classify
```
### --source
Source episode transcripts from spotify api and save to folder and create db records

### --process
Find unprocessed episodes and lookup youtube comments to cross reference with transcripts to generate quote records

### --classify
Find PENDING quotes in database and use a Groq LLM (Llama) to classify quotes as approved if the don't need exta context to work. 