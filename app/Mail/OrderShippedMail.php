<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderShippedMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public $orderId;
    public $waybill;
    public $pdfContent;
    public $fileName;
    public $trackingUrl;

    public function __construct($orderId, $waybill, $pdfContent, $fileName, $trackingUrl = null)
    {
        $this->orderId = $orderId;
        $this->waybill = $waybill;
        $this->pdfContent = $pdfContent;
        $this->fileName = $fileName;
        $this->trackingUrl = $trackingUrl;
    }


    public function build()
    {
        return $this->subject("YOUR ORDER IS ON ITS WAY - #LV-{$this->orderId}")
            ->text('emails.order_shipped_plain')
            ->attachData($this->pdfContent, $this->fileName, [
                'mime' => 'application/pdf',
            ]);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order Shipped Mail',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'view.name',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
