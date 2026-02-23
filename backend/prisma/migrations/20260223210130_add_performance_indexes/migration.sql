-- CreateIndex
CREATE INDEX "client_proposal_access_proposal_idx" ON "client_proposal_access"("proposal");

-- CreateIndex
CREATE INDEX "form_instances_capture_status_idx" ON "form_instances"("capture_status");
