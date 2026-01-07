package dto

type CreateEventRequest struct {
	Title         string `json:"title" binding:"required,min=3,max=100"`
	Description   string `json:"description" binding:"omitempty,max=255"`
	Category      string `json:"category" binding:"omitempty,max=100"`
	StartDate     string `json:"start_date" binding:"omitempty"`
	EndDate       string `json:"end_date" binding:"omitempty"`
	TermsFilePath string `json:"terms_file_path" binding:"omitempty,max=500"` // Kept for backward compatibility, use EventFiles table for multi-file
}

type UpdateEventRequest struct {
	Title         string `json:"title" binding:"omitempty,min=3,max=100"`
	Description   string `json:"description" binding:"omitempty,max=100"`
	Category      string `json:"category" binding:"omitempty,max=100"`
	StartDate     string `json:"start_date" binding:"omitempty"`
	EndDate       string `json:"end_date" binding:"omitempty"`
	TermsFilePath string `json:"terms_file_path" binding:"omitempty,max=500"` // Kept for backward compatibility
	Status        string `json:"status" binding:"omitempty,oneof=draft open closed completed cancelled"`
}

// For file uploads - separate from event creation
type UploadEventFileRequest struct {
	FileType string `json:"file_type" binding:"required,oneof=terms image document"`
	Caption  string `json:"caption" binding:"omitempty,max=100"`
}

type SubmitPitchRequest struct {
	ProposalDetails string `json:"proposal_details" binding:"omitempty"`
}

// For submission file uploads - separate from submission creation
type UploadSubmissionFileRequest struct {
	FileType string `json:"file_type" binding:"required,oneof=pitch proposal document"`
	Caption  string `json:"caption" binding:"omitempty,max=100"`
}

type ScoreSubmissionRequest struct {
	Score    float64 `json:"score" binding:"required,min=0,max=100"`
	Comments string  `json:"comments" binding:"omitempty"`
}

type ShortlistSubmissionRequest struct {
	IsShortlisted bool `json:"is_shortlisted"`
}

type SelectWinnerRequest struct {
	SubmissionID string `json:"submission_id" binding:"required,uuid"`
}
