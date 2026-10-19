package com.gyul.backend.exception;

import lombok.Getter;

@Getter 
public class DuplicateMemberException extends RuntimeException{

    private final String field; // 아이디와 이메일

    public DuplicateMemberException(String field, String message){
        super(message);
        this.field=field;
    } 
}
