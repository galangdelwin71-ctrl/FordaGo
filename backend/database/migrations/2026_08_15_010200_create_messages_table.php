<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->increments('id');

            $table->unsignedInteger('conversation_id');
            $table->foreign('conversation_id')->references('id')->on('conversations')->cascadeOnDelete();

            $table->integer('sender_id');
            $table->foreign('sender_id')->references('id')->on('users')->cascadeOnDelete();

            $table->text('body')->nullable();                            // message text (nullable for proposal-only messages)
            $table->enum('type', ['text', 'proposal'])->default('text'); // text = normal chat, proposal = workout plan card
            $table->timestamp('read_at')->nullable();

            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
