"""Download zai-org/GLM-5.2 as Unsloth 1-bit GGUF onto this machine."""

from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="unsloth/GLM-5.2-GGUF",
    allow_patterns=["UD-IQ1_S/*"],
    local_dir=r"C:\Users\kingc\Projects\AI网络攻击防御\.cache\glm-5.2\gguf",
)
print("GLM-5.2 UD-IQ1_S download complete")
