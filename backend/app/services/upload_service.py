from uuid import UUID

# TODO: Implement using async Supabase client and storage client

class UploadService:
    async def presign(self, user_id: UUID, project_id: UUID, filename: str, size: int) -> dict:
        # TODO: Generate Supabase Storage presigned PUT URL
        #       Insert pending upload record into DB
        #       Return { upload_id, presigned_url, storage_path }
        raise NotImplementedError

    async def confirm(self, user_id: UUID, upload_id: UUID) -> dict:
        # TODO: Verify object exists in Storage
        #       Update upload status to "pending" (slice extraction pending)
        #       Dispatch async structural slice extraction to ETL runner
        raise NotImplementedError

    async def get_slice(self, user_id: UUID, upload_id: UUID) -> dict:
        # TODO: Return upload record with slice_data; status reflects readiness
        raise NotImplementedError
