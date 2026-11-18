package com.reservaya.repository;

import com.reservaya.model.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {

    @Modifying
    @Query("delete from AuthToken t where t.expiresAt < :now")
    int deleteExpired(@Param("now") LocalDateTime now);

    @Modifying
    @Query("delete from AuthToken t where t.user.id = :userId")
    int deleteByUserId(@Param("userId") Long userId);
}
