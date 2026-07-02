"""
Streams completed output files to Supabase Storage.
Storage path follows the exports/{user_id}/{project_id}/{job_id}.{ext} convention.
"""
import httpx


class OutputUploader:
    def __init__(self, presigned_put_url: str) -> None:
        self._url = presigned_put_url

    def upload(self, file_path: str) -> None:
        """
        Streams a local output file to Supabase Storage via presigned PUT URL.
        File is streamed in chunks — never fully loaded into memory.
        """
        # TODO: Implement chunked streaming upload using httpx
        raise NotImplementedError
