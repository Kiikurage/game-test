// Three.js r186 - Node System

// global
diagnostic( off, derivative_uniformity );


// structs

struct OutputStruct {
	@location( 0 ) color: vec4<f32>
};
var<private> output : OutputStruct;

// uniforms
@binding( 0 ) @group( 1 ) var nodeUniform3_sampler : sampler;
@binding( 1 ) @group( 1 ) var nodeUniform3 : texture_2d<f32>;
@binding( 3 ) @group( 1 ) var nodeUniform6_sampler : sampler;
@binding( 4 ) @group( 1 ) var nodeUniform6 : texture_3d<f32>;
@binding( 5 ) @group( 1 ) var nodeUniform10_sampler : sampler;
@binding( 6 ) @group( 1 ) var nodeUniform10 : texture_2d<f32>;
@binding( 7 ) @group( 1 ) var nodeUniform18_sampler : sampler;
@binding( 8 ) @group( 1 ) var nodeUniform18 : texture_2d<f32>;
@binding( 9 ) @group( 1 ) var nodeUniform26_sampler : sampler;
@binding( 10 ) @group( 1 ) var nodeUniform26 : texture_2d<f32>;
@binding( 11 ) @group( 1 ) var nodeUniform39_sampler : sampler_comparison;
@binding( 12 ) @group( 1 ) var nodeUniform39 : texture_depth_2d;

struct objectStruct {
	nodeUniform0 : mat4x4<f32>,
	nodeUniform2 : mat4x4<f32>,
	nodeUniform4 : mat3x3<f32>,
	nodeUniform5 : mat4x4<f32>,
	nodeUniform7 : f32,
	nodeUniform8 : f32,
	nodeUniform9 : f32,
	nodeUniform11 : mat3x3<f32>,
	nodeUniform12 : f32,
	nodeUniform13 : mat3x3<f32>,
	nodeUniform15 : mat3x3<f32>,
	nodeUniform16 : f32,
	nodeUniform17 : vec3<f32>,
	nodeUniform19 : mat3x3<f32>,
	nodeUniform20 : vec2<f32>,
	nodeUniform23 : vec3<f32>,
	nodeUniform24 : vec3<f32>,
	nodeUniform25 : f32,
	nodeUniform47 : vec3<f32>,
	nodeUniform48 : vec3<f32>,
	nodeUniform49 : vec3<f32>,
	nodeUniform50 : f32
};
@binding( 2 ) @group( 1 )
var<uniform> object : objectStruct;

struct renderStruct {
	cameraProjectionMatrix : mat4x4<f32>,
	cameraViewMatrix : mat4x4<f32>,
	nodeUniform28 : vec3<f32>,
	nodeUniform29 : vec3<f32>,
	nodeUniform27 : vec3<f32>,
	nodeUniform32 : vec3<f32>,
	nodeUniform35 : vec3<f32>,
	nodeUniform44 : vec3<f32>,
	nodeUniform45 : f32,
	nodeUniform46 : f32,
	nodeUniform30 : vec3<f32>,
	nodeUniform31 : vec3<f32>,
	nodeUniform33 : vec3<f32>,
	nodeUniform34 : vec3<f32>,
	nodeUniform43 : vec3<f32>,
	nodeUniform36 : mat4x4<f32>,
	nodeUniform37 : f32,
	nodeUniform38 : f32,
	nodeUniform42 : f32,
	cameraPosition : vec3<f32>,
	nodeUniform40 : f32,
	nodeUniform41 : vec2<f32>
};
@binding( 0 ) @group( 0 )
var<uniform> render : renderStruct;

// vars
var<private> DiffuseColor : vec4<f32>;
var<private> nodeVar1 : vec4<f32>;
var<private> nodeVar2 : vec3<f32>;
var<private> nodeVar3 : f32;
var<private> nodeVar4 : f32;
var<private> nodeVar5 : f32;
var<private> nodeVar6 : f32;
var<private> nodeVar7 : f32;
var<private> nodeVar8 : f32;
var<private> nodeVar9 : vec3<f32>;
var<private> nodeVar10 : f32;
var<private> Metalness : f32;
var<private> nodeVar11 : vec4<f32>;
var<private> Roughness : f32;
var<private> nodeVar12 : vec4<f32>;
var<private> normalViewGeometry : vec3<f32>;
var<private> nodeVar13 : vec3<f32>;
var<private> SpecularColor : vec3<f32>;
var<private> SpecularColorBlended : vec3<f32>;
var<private> SpecularF90 : f32;
var<private> DiffuseContribution : vec3<f32>;
var<private> EmissiveColor : vec3<f32>;
var<private> nodeVar14 : f32;
var<private> nodeVar15 : f32;
var<private> NORMAL_normalView : vec3<f32>;
var<private> nodeVar16 : vec3<f32>;
var<private> nodeVar17 : vec2<f32>;
var<private> nodeVar18 : vec3<f32>;
var<private> nodeVar19 : vec2<f32>;
var<private> nodeVar20 : vec3<f32>;
var<private> nodeVar21 : f32;
var<private> nodeVar22 : vec3<f32>;
var<private> nodeVar23 : f32;
var<private> tangentViewFrame : vec3<f32>;
var<private> NORMAL_tangentView : vec3<f32>;
var<private> bitangentViewFrame : vec3<f32>;
var<private> NORMAL_bitangentView : vec3<f32>;
var<private> NORMAL_TBNViewMatrix : mat3x3<f32>;
var<private> nodeVar24 : vec4<f32>;
var<private> nodeVar25 : vec4<f32>;
var<private> normalView : vec3<f32>;
var<private> normalWorld : vec3<f32>;
var<private> nodeVar26 : vec3<f32>;
var<private> nodeVar27 : vec3<f32>;
var<private> nodeVar28 : f32;
var<private> nodeVar29 : f32;
var<private> nodeVar30 : f32;
var<private> Output : vec4<f32>;
var<private> positionViewDirection : vec3<f32>;
var<private> nodeVar31 : f32;
var<private> nodeVar32 : vec2<f32>;
var<private> nodeVar33 : f32;
var<private> nodeVar34 : f32;
var<private> nodeVar35 : f32;
var<private> nodeVar36 : f32;
var<private> nodeVar37 : vec3<f32>;
var<private> nodeVar38 : vec3<f32>;
var<private> irradiance : vec3<f32>;
var<private> nodeVar39 : f32;
var<private> nodeVar40 : f32;
var<private> nodeVar41 : f32;
var<private> nodeVar42 : vec3<f32>;
var<private> nodeVar43 : vec3<f32>;
var<private> nodeVar44 : vec3<f32>;
var<private> nodeVar45 : vec4<f32>;
var<private> nodeVar46 : vec4<f32>;
var<private> nodeVar47 : vec3<f32>;
var<private> nodeVar48 : vec3<f32>;
var<private> nodeVar49 : f32;
var<private> nodeVar50 : vec3<f32>;
var<private> nodeVar51 : vec3<f32>;
var<private> directDiffuse : vec3<f32>;
var<private> nodeVar52 : vec3<f32>;
var<private> nodeVar53 : vec3<f32>;
var<private> nodeVar54 : vec3<f32>;
var<private> nodeVar55 : vec3<f32>;
var<private> nodeVar56 : f32;
var<private> nodeVar57 : f32;
var<private> nodeVar58 : f32;
var<private> nodeVar59 : vec3<f32>;
var<private> nodeVar60 : vec3<f32>;
var<private> nodeVar61 : vec3<f32>;
var<private> nodeVar62 : vec3<f32>;
var<private> nodeVar63 : vec3<f32>;
var<private> directSpecular : vec3<f32>;
var<private> nodeVar64 : vec3<f32>;
var<private> nodeVar65 : f32;
var<private> nodeVar66 : f32;
var<private> nodeVar67 : f32;
var<private> nodeVar68 : vec3<f32>;
var<private> nodeVar69 : vec3<f32>;
var<private> nodeVar70 : vec3<f32>;
var<private> nodeVar71 : vec3<f32>;
var<private> nodeVar72 : vec3<f32>;
var<private> nodeVar73 : vec4<f32>;
var<private> nodeVar74 : vec4<f32>;
var<private> nodeVar75 : vec3<f32>;
var<private> nodeVar76 : vec3<f32>;
var<private> nodeVar77 : f32;
var<private> shadowPositionWorld : vec3<f32>;
var<private> nodeVar78 : f32;
var<private> nodeVar79 : vec4<f32>;
var<private> nodeVar80 : vec3<f32>;
var<private> nodeVar81 : vec3<f32>;
var<private> nodeVar82 : f32;
var<private> nodeVar83 : f32;
var<private> nodeVar84 : vec2<f32>;
var<private> nodeVar85 : f32;
var<private> nodeVar86 : vec2<f32>;
var<private> nodeVar87 : f32;
var<private> nodeVar88 : vec2<f32>;
var<private> nodeVar89 : f32;
var<private> nodeVar90 : vec2<f32>;
var<private> nodeVar91 : f32;
var<private> nodeVar92 : vec2<f32>;
var<private> nodeVar93 : f32;
var<private> nodeVar94 : f32;
var<private> nodeVar95 : vec3<f32>;
var<private> nodeVar96 : vec3<f32>;
var<private> nodeVar97 : vec3<f32>;
var<private> nodeVar98 : vec3<f32>;
var<private> nodeVar99 : vec3<f32>;
var<private> nodeVar100 : vec3<f32>;
var<private> nodeVar101 : f32;
var<private> nodeVar102 : f32;
var<private> nodeVar103 : f32;
var<private> nodeVar104 : vec3<f32>;
var<private> nodeVar105 : vec3<f32>;
var<private> nodeVar106 : vec3<f32>;
var<private> nodeVar107 : vec3<f32>;
var<private> nodeVar108 : vec3<f32>;
var<private> nodeVar109 : vec3<f32>;
var<private> nodeVar110 : f32;
var<private> nodeVar111 : f32;
var<private> nodeVar112 : f32;
var<private> nodeVar113 : vec3<f32>;
var<private> nodeVar114 : vec3<f32>;
var<private> nodeVar115 : vec3<f32>;
var<private> nodeVar116 : vec3<f32>;
var<private> nodeVar117 : vec3<f32>;
var<private> nodeVar118 : vec3<f32>;
var<private> nodeVar119 : f32;
var<private> nodeVar120 : f32;
var<private> nodeVar121 : f32;
var<private> nodeVar122 : f32;
var<private> nodeVar123 : f32;
var<private> nodeVar124 : vec3<f32>;
var<private> nodeVar125 : vec3<f32>;
var<private> nodeVar126 : vec3<f32>;
var<private> nodeVar127 : vec3<f32>;
var<private> nodeVar128 : vec3<f32>;
var<private> nodeVar129 : vec3<f32>;
var<private> nodeVar130 : vec3<f32>;
var<private> nodeVar131 : f32;
var<private> nodeVar132 : f32;
var<private> nodeVar133 : f32;
var<private> nodeVar134 : vec3<f32>;
var<private> nodeVar135 : vec3<f32>;
var<private> nodeVar136 : vec3<f32>;
var<private> nodeVar137 : vec3<f32>;
var<private> nodeVar138 : vec3<f32>;
var<private> nodeVar139 : vec3<f32>;
var<private> nodeVar140 : f32;
var<private> nodeVar141 : f32;
var<private> nodeVar142 : f32;
var<private> nodeVar143 : vec3<f32>;
var<private> nodeVar144 : vec3<f32>;
var<private> nodeVar145 : vec3<f32>;
var<private> nodeVar146 : vec3<f32>;
var<private> nodeVar147 : vec3<f32>;
var<private> nodeVar148 : vec3<f32>;
var<private> nodeVar149 : vec3<f32>;
var<private> nodeVar150 : f32;
var<private> nodeVar151 : vec3<f32>;
var<private> nodeVar152 : vec3<f32>;
var<private> nodeVar153 : vec3<f32>;
var<private> nodeVar154 : vec3<f32>;
var<private> nodeVar155 : vec3<f32>;
var<private> nodeVar156 : vec3<f32>;
var<private> nodeVar157 : vec3<f32>;
var<private> nodeVar158 : f32;
var<private> nodeVar159 : f32;
var<private> nodeVar160 : f32;
var<private> nodeVar161 : vec3<f32>;
var<private> nodeVar162 : vec3<f32>;
var<private> nodeVar163 : vec3<f32>;
var<private> nodeVar164 : vec3<f32>;
var<private> nodeVar165 : vec3<f32>;
var<private> nodeVar166 : vec3<f32>;
var<private> nodeVar167 : vec3<f32>;
var<private> nodeVar168 : vec3<f32>;
var<private> nodeVar169 : vec3<f32>;
var<private> nodeVar170 : vec3<f32>;
var<private> nodeVar171 : vec3<f32>;
var<private> nodeVar172 : vec3<f32>;
var<private> nodeVar173 : vec3<f32>;
var<private> indirectDiffuse : vec3<f32>;
var<private> nodeVar174 : vec3<f32>;
var<private> singleScatteringDielectric : vec3<f32>;
var<private> multiScatteringDielectric : vec3<f32>;
var<private> singleScatteringMetallic : vec3<f32>;
var<private> multiScatteringMetallic : vec3<f32>;
var<private> nodeVar175 : vec3<f32>;
var<private> nodeVar176 : f32;
var<private> nodeVar177 : vec3<f32>;
var<private> nodeVar178 : vec3<f32>;
var<private> nodeVar179 : vec3<f32>;
var<private> nodeVar180 : vec3<f32>;
var<private> nodeVar181 : vec3<f32>;
var<private> nodeVar182 : vec3<f32>;
var<private> nodeVar183 : vec3<f32>;
var<private> nodeVar184 : f32;
var<private> nodeVar185 : f32;
var<private> nodeVar186 : f32;
var<private> nodeVar187 : vec3<f32>;
var<private> nodeVar188 : vec3<f32>;
var<private> nodeVar189 : vec3<f32>;
var<private> nodeVar190 : vec3<f32>;
var<private> nodeVar191 : vec3<f32>;
var<private> nodeVar192 : vec3<f32>;
var<private> nodeVar193 : vec3<f32>;
var<private> nodeVar194 : f32;
var<private> nodeVar195 : vec3<f32>;
var<private> nodeVar196 : vec3<f32>;
var<private> nodeVar197 : vec3<f32>;
var<private> nodeVar198 : vec3<f32>;
var<private> nodeVar199 : vec3<f32>;
var<private> nodeVar200 : vec3<f32>;
var<private> nodeVar201 : vec3<f32>;
var<private> nodeVar202 : f32;
var<private> nodeVar203 : f32;
var<private> nodeVar204 : f32;
var<private> nodeVar205 : vec3<f32>;
var<private> nodeVar206 : vec3<f32>;
var<private> nodeVar207 : vec3<f32>;
var<private> nodeVar208 : vec3<f32>;
var<private> nodeVar209 : vec3<f32>;
var<private> nodeVar210 : vec3<f32>;
var<private> radiance : vec3<f32>;
var<private> nodeVar211 : vec3<f32>;
var<private> nodeVar212 : vec3<f32>;
var<private> nodeVar213 : vec3<f32>;
var<private> iblIrradiance : vec3<f32>;
var<private> nodeVar214 : vec3<f32>;
var<private> nodeVar215 : vec3<f32>;
var<private> nodeVar216 : vec3<f32>;
var<private> nodeVar217 : vec3<f32>;
var<private> nodeVar218 : vec3<f32>;
var<private> nodeVar219 : vec3<f32>;
var<private> nodeVar220 : vec3<f32>;
var<private> nodeVar221 : vec3<f32>;
var<private> nodeVar222 : vec3<f32>;
var<private> nodeVar223 : vec3<f32>;
var<private> indirectSpecular : vec3<f32>;
var<private> nodeVar224 : vec3<f32>;
var<private> nodeVar225 : vec3<f32>;
var<private> ambientOcclusion : f32;
var<private> nodeVar226 : vec3<f32>;
var<private> nodeVar227 : f32;
var<private> nodeVar228 : f32;
var<private> nodeVar229 : f32;
var<private> nodeVar230 : f32;
var<private> nodeVar231 : f32;
var<private> nodeVar232 : f32;
var<private> nodeVar233 : f32;
var<private> nodeVar234 : f32;
var<private> nodeVar235 : f32;
var<private> nodeVar236 : f32;
var<private> nodeVar237 : f32;
var<private> nodeVar238 : vec3<f32>;
var<private> totalDiffuse : vec3<f32>;
var<private> nodeVar239 : vec3<f32>;
var<private> totalSpecular : vec3<f32>;
var<private> nodeVar240 : vec3<f32>;
var<private> outgoingLight : vec3<f32>;
var<private> nodeVar241 : vec3<f32>;
var<private> nodeVar242 : f32;
var<private> nodeVar243 : vec4<f32>;

// codes
fn V_GGX_SmithCorrelated ( alpha : f32, dotNL : f32, dotNV : f32 ) -> f32 {

	var nodeVar0 : f32;

	nodeVar0 = ( alpha * alpha );

	return ( 0.5 / max( ( ( dotNL * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNV * dotNV ) ) ) ) ) + ( dotNV * sqrt( ( nodeVar0 + ( ( 1.0 - nodeVar0 ) * ( dotNL * dotNL ) ) ) ) ) ), 0.000001 ) );

}


fn D_GGX ( alpha : f32, dotNH : f32 ) -> f32 {

	var nodeVar0 : f32;
	var nodeVar1 : f32;

	nodeVar0 = ( alpha * alpha );
	nodeVar1 = ( 1.0 - ( ( dotNH * dotNH ) * ( 1.0 - nodeVar0 ) ) );

	return ( ( nodeVar0 / ( nodeVar1 * nodeVar1 ) ) * 0.3183098861837907 );

}


fn interleavedGradientNoise ( position : vec2<f32> ) -> f32 {

	


	return fract( ( 52.9829189 * fract( dot( position, vec2<f32>( 0.06711056, 0.00583715 ) ) ) ) );

}


fn vogelDiskSample ( sampleIndex : i32, samplesCount : i32, phi : f32 ) -> vec2<f32> {

	var nodeVar0 : f32;

	nodeVar0 = ( ( f32( sampleIndex ) * 2.399963229728653 ) + phi );

	return ( vec2<f32>( cos( nodeVar0 ), sin( nodeVar0 ) ) * vec2<f32>( sqrt( ( ( f32( sampleIndex ) + 0.5 ) / f32( samplesCount ) ) ) ) );

}




@fragment
fn main( @location( 0 ) v_positionView : vec3<f32>,
	@location( 1 ) v_positionWorld : vec3<f32>,
	@location( 2 ) v_normalViewGeometry : vec3<f32>,
	@location( 3 ) v_positionViewDirection : vec3<f32>,
	@location( 4 ) nodeVarying7 : vec2<f32>,
	@builtin( position ) fragCoord : vec4<f32> ) -> OutputStruct {

	// flow
	// code

	nodeVar1 = textureSample( nodeUniform3, nodeUniform3_sampler, ( object.nodeUniform4 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar2 = ( nodeVar1.xyz * vec3<f32>( 0.78, 0.85, 1.0 ) );
	nodeVar3 = textureSample( nodeUniform6, nodeUniform6_sampler, ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 14.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar4 = mix( -0.11, 1.01, object.nodeUniform7 );
	nodeVar5 = textureSample( nodeUniform6, nodeUniform6_sampler, ( ( v_positionWorld * vec3<f32>( 4.2 ) ) / vec3<f32>( 8.0 ) ) ).x;
	nodeVar6 = clamp( ( ( nodeVar5 * 0.9 ) + 0.5 ), 0.0, 1.0 );
	nodeVar7 = ( 1.0 - smoothstep( nodeVar4, ( nodeVar4 + 0.1 ), nodeVar6 ) );
	nodeVar8 = ( nodeVar7 * nodeVar7 );
	nodeVar9 = mix( ( ( ( ( mix( vec3<f32>( dot( nodeVar2, vec3<f32>( 0.2126, 0.7152, 0.0722 ) ) ), nodeVar2, 0.35 ) * vec3<f32>( 0.10702310296918527, 0.08021982030622662, 0.061246054224174035 ) ) * vec3<f32>( 7.0 ) ) * vec3<f32>( ( ( smoothstep( 0.0, 1.1, v_positionWorld.y ) * 0.45 ) + 0.55 ) ) ) * vec3<f32>( ( ( smoothstep( -0.2, 0.5, nodeVar3 ) * 0.35 ) + 0.65 ) ) ), vec3<f32>( 0.007499032040460618, 0.005605391621829108, 0.004776953478513362 ), ( nodeVar8 * 0.9 ) );
	DiffuseColor = vec4<f32>( nodeVar9, 1.0 );

	if ( ( nodeVar6 > nodeVar4 ) ) {

		nodeVar10 = 1.0;

	} else {

		nodeVar10 = 0.0;

	}

	DiffuseColor.w = ( DiffuseColor.w * nodeVar10 );

	if ( ( DiffuseColor.w <= object.nodeUniform8 ) ) {

		discard;
		

	}

	DiffuseColor.w = 1.0;
	nodeVar11 = textureSample( nodeUniform10, nodeUniform10_sampler, ( object.nodeUniform11 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	Metalness = ( object.nodeUniform9 * nodeVar11.z );
	nodeVar12 = textureSample( nodeUniform10, nodeUniform10_sampler, ( object.nodeUniform13 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	normalViewGeometry = normalize( v_normalViewGeometry );
	nodeVar13 = max( abs( dpdx( normalViewGeometry ) ), abs( - dpdy( normalViewGeometry ) ) );
	Roughness = min( ( max( ( object.nodeUniform12 * nodeVar12.y ), 0.0525 ) + max( max( nodeVar13.x, nodeVar13.y ), nodeVar13.z ) ), 1.0 );
	SpecularColor = vec3<f32>( 0.04, 0.04, 0.04 );
	SpecularColorBlended = mix( vec3<f32>( 0.04, 0.04, 0.04 ), DiffuseColor.xyz, Metalness );
	SpecularF90 = 1.0;
	DiffuseContribution = ( DiffuseColor.xyz * vec3<f32>( ( 1.0 - ( object.nodeUniform9 * nodeVar11.z ) ) ) );
	nodeVar14 = textureSample( nodeUniform6, nodeUniform6_sampler, ( vec3<f32>( ( nodeVarying7 * vec2<f32>( 30.0 ) ), 0.37 ) / vec3<f32>( 8.0 ) ) ).x;

	if ( ( object.nodeUniform7 > 0.0 ) ) {

		nodeVar15 = 3.2;

	} else {

		nodeVar15 = 0.0;

	}

	NORMAL_normalView = normalViewGeometry;
	nodeVar16 = cross( - dpdy( v_positionView ), NORMAL_normalView );
	nodeVar17 = dpdx( nodeVarying7 );
	nodeVar18 = cross( NORMAL_normalView, dpdx( v_positionView ) );
	nodeVar19 = - dpdy( nodeVarying7 );
	nodeVar20 = ( ( nodeVar16 * vec3<f32>( nodeVar17.x ) ) + ( nodeVar18 * vec3<f32>( nodeVar19.x ) ) );
	nodeVar22 = ( ( nodeVar16 * vec3<f32>( nodeVar17.y ) ) + ( nodeVar18 * vec3<f32>( nodeVar19.y ) ) );
	nodeVar23 = max( dot( nodeVar20, nodeVar20 ), dot( nodeVar22, nodeVar22 ) );

	if ( ( nodeVar23 == 0.0 ) ) {

		nodeVar21 = 0.0;

	} else {

		nodeVar21 = inverseSqrt( nodeVar23 );

	}

	tangentViewFrame = ( nodeVar20 * vec3<f32>( nodeVar21 ) );
	NORMAL_tangentView = tangentViewFrame;
	bitangentViewFrame = ( nodeVar22 * nodeVar21 );
	NORMAL_bitangentView = bitangentViewFrame;
	NORMAL_TBNViewMatrix = mat3x3<f32>( NORMAL_tangentView, NORMAL_bitangentView, NORMAL_normalView );
	nodeVar24 = textureSample( nodeUniform18, nodeUniform18_sampler, ( object.nodeUniform19 * vec3<f32>( nodeVarying7, 1.0 ) ).xy );
	nodeVar25 = ( ( nodeVar24 * vec4<f32>( 2.0 ) ) - vec4<f32>( 1.0 ) );
	normalView = normalize( ( NORMAL_TBNViewMatrix * vec3<f32>( ( nodeVar25.xy * object.nodeUniform20 ), nodeVar25.z ) ) );
	normalWorld = normalize( ( vec4<f32>( normalView, 0.0 ) * render.cameraViewMatrix ).xyz );
	nodeVar26 = normalize( normalWorld );
	nodeVar27 = normalize( ( render.cameraPosition - v_positionWorld ) );
	nodeVar28 = pow( ( 1.0 - clamp( dot( nodeVar26, nodeVar27 ), 0.0, 1.0 ) ), 3.0 );
	nodeVar29 = smoothstep( -0.35, 0.55, dot( nodeVar26, object.nodeUniform23 ) );
	nodeVar30 = smoothstep( -0.15, 0.85, ( - dot( nodeVar27, object.nodeUniform23 ) ) );
	EmissiveColor = ( ( ( ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( object.nodeUniform16 ) ) * vec3<f32>( ( 1.0 - smoothstep( 0.0, 0.035, abs( nodeVar14 ) ) ) ) ) * vec3<f32>( 0.9 ) ) + ( ( vec3<f32>( 1.0, 0.10224173307914941, 0.0069954101845983935 ) * vec3<f32>( smoothstep( 0.35, 1.0, nodeVar7 ) ) ) * vec3<f32>( nodeVar15 ) ) ) + ( mix( vec3<f32>( 0.0, 0.0, 0.0 ), ( ( ( ( ( object.nodeUniform17 * vec3<f32>( nodeVar28 ) ) * vec3<f32>( nodeVar29 ) ) * vec3<f32>( ( ( nodeVar30 * 1.38 ) + 0.12 ) ) ) + ( ( ( object.nodeUniform24 * vec3<f32>( nodeVar28 ) ) * vec3<f32>( ( 1.0 - ( nodeVar29 * nodeVar30 ) ) ) ) * vec3<f32>( 0.18 ) ) ) + ( ( ( nodeVar9 * vec3<f32>( 0.07 ) ) * vec3<f32>( ( 1.0 - ( smoothstep( 0.0, 0.5, dot( nodeVar9, vec3<f32>( 0.299, 0.587, 0.114 ) ) ) * 0.6 ) ) ) ) + vec3<f32>( 0.006, 0.0055, 0.005 ) ) ), object.nodeUniform25 ) * vec3<f32>( ( 1.0 - nodeVar8 ) ) ) );
	positionViewDirection = normalize( v_positionViewDirection );
	nodeVar31 = dot( normalView, positionViewDirection );
	nodeVar32 = textureSample( nodeUniform26, nodeUniform26_sampler, vec2<f32>( Roughness, clamp( nodeVar31, 0.0, 1.0 ) ) ).xy;
	let dfg = nodeVar32;
	nodeVar33 = ( dfg.x + dfg.y );
	nodeVar34 = ( 1.0 / nodeVar33 );
	nodeVar35 = nodeVar34;
	nodeVar36 = ( nodeVar35 - 1.0 );
	nodeVar37 = ( SpecularColorBlended * vec3<f32>( nodeVar36 ) );
	nodeVar38 = ( nodeVar37 + vec3<f32>( 1.0 ) );
	let multiScatteringCompensation = nodeVar38;
	irradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar39 = dot( normalWorld, normalize( render.nodeUniform29 ) );
	nodeVar40 = ( nodeVar39 * 0.5 );
	nodeVar41 = ( nodeVar40 + 0.5 );
	nodeVar42 = mix( render.nodeUniform27, render.nodeUniform28, nodeVar41 );
	nodeVar43 = ( irradiance + nodeVar42 );
	irradiance = nodeVar43;
	nodeVar44 = ( render.nodeUniform30 - render.nodeUniform31 );
	nodeVar45 = vec4<f32>( nodeVar44, 0.0 );
	nodeVar46 = ( render.cameraViewMatrix * nodeVar45 );
	nodeVar47 = normalize( nodeVar46.xyz );
	nodeVar48 = nodeVar47;
	nodeVar49 = dot( normalView, nodeVar48 );
	nodeVar50 = ( vec3<f32>( clamp( nodeVar49, 0.0, 1.0 ) ) * render.nodeUniform32 );
	nodeVar51 = nodeVar50;
	directDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar52 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar53 = ( nodeVar51 * nodeVar52 );
	nodeVar54 = ( nodeVar48 + positionViewDirection );
	nodeVar55 = normalize( nodeVar54 );
	nodeVar56 = dot( positionViewDirection, nodeVar55 );
	nodeVar57 = clamp( nodeVar56, 0.0, 1.0 );
	nodeVar58 = exp2( ( ( ( nodeVar57 * -5.55473 ) - 6.98316 ) * nodeVar57 ) );
	nodeVar59 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar58 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar58 ) ) );
	nodeVar60 = ( vec3<f32>( 1.0 ) - nodeVar59 );
	nodeVar61 = nodeVar60;
	nodeVar62 = ( nodeVar53 * nodeVar61 );
	nodeVar63 = ( directDiffuse + nodeVar62 );
	directDiffuse = nodeVar63;
	directSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar64 = normalize( ( nodeVar48 + positionViewDirection ) );
	nodeVar65 = clamp( dot( positionViewDirection, nodeVar64 ), 0.0, 1.0 );
	nodeVar66 = exp2( ( ( ( nodeVar65 * -5.55473 ) - 6.98316 ) * nodeVar65 ) );
	nodeVar67 = ( Roughness * Roughness );
	nodeVar68 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar66 ) ) ) + vec3<f32>( ( 1.0 * nodeVar66 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar67, clamp( dot( normalView, nodeVar48 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar67, clamp( dot( normalView, nodeVar64 ), 0.0, 1.0 ) ) ) );
	nodeVar69 = ( nodeVar51 * nodeVar68 );
	nodeVar70 = ( nodeVar69 * multiScatteringCompensation );
	nodeVar71 = ( directSpecular + nodeVar70 );
	directSpecular = nodeVar71;
	nodeVar72 = ( render.nodeUniform33 - render.nodeUniform34 );
	nodeVar73 = vec4<f32>( nodeVar72, 0.0 );
	nodeVar74 = ( render.cameraViewMatrix * nodeVar73 );
	nodeVar75 = normalize( nodeVar74.xyz );
	nodeVar76 = nodeVar75;
	nodeVar77 = dot( normalView, nodeVar76 );
	shadowPositionWorld = v_positionWorld;
	nodeVar79 = ( render.nodeUniform36 * vec4<f32>( ( shadowPositionWorld + ( normalWorld * vec3<f32>( render.nodeUniform37 ) ) ), 1.0 ) );
	nodeVar80 = ( nodeVar79.xyz / vec3<f32>( nodeVar79.w ) );
	nodeVar81 = vec3<f32>( nodeVar80.x, ( 1.0 - nodeVar80.y ), ( nodeVar80.z + render.nodeUniform38 ) );

	if ( ( ( ( ( ( nodeVar81.x >= 0.0 ) && ( nodeVar81.x <= 1.0 ) ) && ( nodeVar81.y >= 0.0 ) ) && ( nodeVar81.y <= 1.0 ) ) && ( nodeVar81.z <= 1.0 ) ) ) {

		nodeVar82 = ( interleavedGradientNoise( fragCoord.xy ) * 6.28318530718 );
		nodeVar83 = ( render.nodeUniform40 * ( vec2<f32>( 1.0, 1.0 ) / render.nodeUniform41 ).x );
		nodeVar84 = ( nodeVar81.xy + ( vogelDiskSample( 0, 5, nodeVar82 ) * vec2<f32>( nodeVar83 ) ) );
		nodeVar85 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar84, nodeVar81.z );
		nodeVar86 = ( nodeVar81.xy + ( vogelDiskSample( 1, 5, nodeVar82 ) * vec2<f32>( nodeVar83 ) ) );
		nodeVar87 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar86, nodeVar81.z );
		nodeVar88 = ( nodeVar81.xy + ( vogelDiskSample( 2, 5, nodeVar82 ) * vec2<f32>( nodeVar83 ) ) );
		nodeVar89 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar88, nodeVar81.z );
		nodeVar90 = ( nodeVar81.xy + ( vogelDiskSample( 3, 5, nodeVar82 ) * vec2<f32>( nodeVar83 ) ) );
		nodeVar91 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar90, nodeVar81.z );
		nodeVar92 = ( nodeVar81.xy + ( vogelDiskSample( 4, 5, nodeVar82 ) * vec2<f32>( nodeVar83 ) ) );
		nodeVar93 = textureSampleCompare( nodeUniform39, nodeUniform39_sampler, nodeVar92, nodeVar81.z );
		nodeVar78 = ( ( ( ( ( nodeVar85 + nodeVar87 ) + nodeVar89 ) + nodeVar91 ) + nodeVar93 ) * 0.2 );

	} else {

		nodeVar78 = 1.0;

	}

	nodeVar94 = mix( 1.0, nodeVar78, render.nodeUniform42 );
	nodeVar95 = ( vec3<f32>( clamp( nodeVar77, 0.0, 1.0 ) ) * ( render.nodeUniform35 * vec3<f32>( nodeVar94 ) ) );
	nodeVar96 = nodeVar95;
	nodeVar97 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar98 = ( nodeVar96 * nodeVar97 );
	nodeVar99 = ( nodeVar76 + positionViewDirection );
	nodeVar100 = normalize( nodeVar99 );
	nodeVar101 = dot( positionViewDirection, nodeVar100 );
	nodeVar102 = clamp( nodeVar101, 0.0, 1.0 );
	nodeVar103 = exp2( ( ( ( nodeVar102 * -5.55473 ) - 6.98316 ) * nodeVar102 ) );
	nodeVar104 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar103 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar103 ) ) );
	nodeVar105 = ( vec3<f32>( 1.0 ) - nodeVar104 );
	nodeVar106 = nodeVar105;
	nodeVar107 = ( nodeVar98 * nodeVar106 );
	nodeVar108 = ( directDiffuse + nodeVar107 );
	directDiffuse = nodeVar108;
	nodeVar109 = normalize( ( nodeVar76 + positionViewDirection ) );
	nodeVar110 = clamp( dot( positionViewDirection, nodeVar109 ), 0.0, 1.0 );
	nodeVar111 = exp2( ( ( ( nodeVar110 * -5.55473 ) - 6.98316 ) * nodeVar110 ) );
	nodeVar112 = ( Roughness * Roughness );
	nodeVar113 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar111 ) ) ) + vec3<f32>( ( 1.0 * nodeVar111 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar112, clamp( dot( normalView, nodeVar76 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar112, clamp( dot( normalView, nodeVar109 ), 0.0, 1.0 ) ) ) );
	nodeVar114 = ( nodeVar96 * nodeVar113 );
	nodeVar115 = ( nodeVar114 * multiScatteringCompensation );
	nodeVar116 = ( directSpecular + nodeVar115 );
	directSpecular = nodeVar116;
	nodeVar117 = ( render.nodeUniform43 - v_positionView );
	nodeVar118 = normalize( nodeVar117 );
	nodeVar119 = dot( normalView, nodeVar118 );

	if ( ( render.nodeUniform45 > 0.0 ) ) {

		nodeVar121 = length( nodeVar117 );
		nodeVar122 = ( nodeVar121 / render.nodeUniform45 );
		nodeVar123 = clamp( ( 1.0 - ( ( ( nodeVar122 * nodeVar122 ) * nodeVar122 ) * nodeVar122 ) ), 0.0, 1.0 );
		nodeVar120 = ( ( 1.0 / max( pow( nodeVar121, render.nodeUniform46 ), 0.01 ) ) * ( nodeVar123 * nodeVar123 ) );

	} else {

		nodeVar120 = ( 1.0 / max( pow( length( nodeVar117 ), render.nodeUniform46 ), 0.01 ) );

	}

	nodeVar124 = ( render.nodeUniform44 * vec3<f32>( nodeVar120 ) );
	nodeVar125 = ( vec3<f32>( clamp( nodeVar119, 0.0, 1.0 ) ) * nodeVar124 );
	nodeVar126 = nodeVar125;
	nodeVar127 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar128 = ( nodeVar126 * nodeVar127 );
	nodeVar129 = ( nodeVar118 + positionViewDirection );
	nodeVar130 = normalize( nodeVar129 );
	nodeVar131 = dot( positionViewDirection, nodeVar130 );
	nodeVar132 = clamp( nodeVar131, 0.0, 1.0 );
	nodeVar133 = exp2( ( ( ( nodeVar132 * -5.55473 ) - 6.98316 ) * nodeVar132 ) );
	nodeVar134 = ( ( SpecularColor * vec3<f32>( ( 1.0 - nodeVar133 ) ) ) + vec3<f32>( ( SpecularF90 * nodeVar133 ) ) );
	nodeVar135 = ( vec3<f32>( 1.0 ) - nodeVar134 );
	nodeVar136 = nodeVar135;
	nodeVar137 = ( nodeVar128 * nodeVar136 );
	nodeVar138 = ( directDiffuse + nodeVar137 );
	directDiffuse = nodeVar138;
	nodeVar139 = normalize( ( nodeVar118 + positionViewDirection ) );
	nodeVar140 = clamp( dot( positionViewDirection, nodeVar139 ), 0.0, 1.0 );
	nodeVar141 = exp2( ( ( ( nodeVar140 * -5.55473 ) - 6.98316 ) * nodeVar140 ) );
	nodeVar142 = ( Roughness * Roughness );
	nodeVar143 = ( ( ( ( SpecularColorBlended * vec3<f32>( ( 1.0 - nodeVar141 ) ) ) + vec3<f32>( ( 1.0 * nodeVar141 ) ) ) * vec3<f32>( V_GGX_SmithCorrelated( nodeVar142, clamp( dot( normalView, nodeVar118 ), 0.0, 1.0 ), clamp( dot( normalView, positionViewDirection ), 0.0, 1.0 ) ) ) ) * vec3<f32>( D_GGX( nodeVar142, clamp( dot( normalView, nodeVar139 ), 0.0, 1.0 ) ) ) );
	nodeVar144 = ( nodeVar126 * nodeVar143 );
	nodeVar145 = ( nodeVar144 * multiScatteringCompensation );
	nodeVar146 = ( directSpecular + nodeVar145 );
	directSpecular = nodeVar146;
	nodeVar147 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar148 = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar149 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar150 = ( SpecularF90 * dfg.y );
	nodeVar151 = ( nodeVar149 + vec3<f32>( nodeVar150 ) );
	nodeVar152 = ( nodeVar147 + nodeVar151 );
	nodeVar147 = nodeVar152;
	nodeVar153 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar154 = nodeVar153;
	nodeVar155 = ( nodeVar154 * vec3<f32>( 0.047619 ) );
	nodeVar156 = ( SpecularColor + nodeVar155 );
	nodeVar157 = ( nodeVar151 * nodeVar156 );
	nodeVar158 = ( dfg.x + dfg.y );
	nodeVar159 = ( 1.0 - nodeVar158 );
	nodeVar160 = nodeVar159;
	nodeVar161 = ( vec3<f32>( nodeVar160 ) * nodeVar156 );
	nodeVar162 = ( vec3<f32>( 1.0 ) - nodeVar161 );
	nodeVar163 = nodeVar162;
	nodeVar164 = ( nodeVar157 / nodeVar163 );
	nodeVar165 = ( nodeVar164 * vec3<f32>( nodeVar160 ) );
	nodeVar166 = ( nodeVar148 + nodeVar165 );
	nodeVar148 = nodeVar166;
	nodeVar167 = ( DiffuseContribution * vec3<f32>( 0.3183098861837907 ) );
	nodeVar168 = ( irradiance * nodeVar167 );
	nodeVar169 = ( nodeVar147 + nodeVar148 );
	nodeVar170 = ( vec3<f32>( 1.0 ) - nodeVar169 );
	nodeVar171 = nodeVar170;
	nodeVar172 = ( nodeVar168 * nodeVar171 );
	nodeVar173 = nodeVar172;
	indirectDiffuse = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar174 = ( indirectDiffuse + nodeVar173 );
	indirectDiffuse = nodeVar174;
	singleScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringDielectric = vec3<f32>( 0.0, 0.0, 0.0 );
	singleScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	multiScatteringMetallic = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar175 = ( SpecularColor * vec3<f32>( dfg.x ) );
	nodeVar176 = ( SpecularF90 * dfg.y );
	nodeVar177 = ( nodeVar175 + vec3<f32>( nodeVar176 ) );
	nodeVar178 = ( singleScatteringDielectric + nodeVar177 );
	singleScatteringDielectric = nodeVar178;
	nodeVar179 = ( vec3<f32>( 1.0 ) - SpecularColor );
	nodeVar180 = nodeVar179;
	nodeVar181 = ( nodeVar180 * vec3<f32>( 0.047619 ) );
	nodeVar182 = ( SpecularColor + nodeVar181 );
	nodeVar183 = ( nodeVar177 * nodeVar182 );
	nodeVar184 = ( dfg.x + dfg.y );
	nodeVar185 = ( 1.0 - nodeVar184 );
	nodeVar186 = nodeVar185;
	nodeVar187 = ( vec3<f32>( nodeVar186 ) * nodeVar182 );
	nodeVar188 = ( vec3<f32>( 1.0 ) - nodeVar187 );
	nodeVar189 = nodeVar188;
	nodeVar190 = ( nodeVar183 / nodeVar189 );
	nodeVar191 = ( nodeVar190 * vec3<f32>( nodeVar186 ) );
	nodeVar192 = ( multiScatteringDielectric + nodeVar191 );
	multiScatteringDielectric = nodeVar192;
	nodeVar193 = ( DiffuseColor.xyz * vec3<f32>( dfg.x ) );
	nodeVar194 = ( SpecularF90 * dfg.y );
	nodeVar195 = ( nodeVar193 + vec3<f32>( nodeVar194 ) );
	nodeVar196 = ( singleScatteringMetallic + nodeVar195 );
	singleScatteringMetallic = nodeVar196;
	nodeVar197 = ( vec3<f32>( 1.0 ) - DiffuseColor.xyz );
	nodeVar198 = nodeVar197;
	nodeVar199 = ( nodeVar198 * vec3<f32>( 0.047619 ) );
	nodeVar200 = ( DiffuseColor.xyz + nodeVar199 );
	nodeVar201 = ( nodeVar195 * nodeVar200 );
	nodeVar202 = ( dfg.x + dfg.y );
	nodeVar203 = ( 1.0 - nodeVar202 );
	nodeVar204 = nodeVar203;
	nodeVar205 = ( vec3<f32>( nodeVar204 ) * nodeVar200 );
	nodeVar206 = ( vec3<f32>( 1.0 ) - nodeVar205 );
	nodeVar207 = nodeVar206;
	nodeVar208 = ( nodeVar201 / nodeVar207 );
	nodeVar209 = ( nodeVar208 * vec3<f32>( nodeVar204 ) );
	nodeVar210 = ( multiScatteringMetallic + nodeVar209 );
	multiScatteringMetallic = nodeVar210;
	radiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar211 = mix( singleScatteringDielectric, singleScatteringMetallic, Metalness );
	nodeVar212 = ( radiance * nodeVar211 );
	nodeVar213 = mix( multiScatteringDielectric, multiScatteringMetallic, Metalness );
	iblIrradiance = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar214 = ( iblIrradiance * vec3<f32>( 0.3183098861837907 ) );
	nodeVar215 = ( nodeVar213 * nodeVar214 );
	nodeVar216 = ( nodeVar212 + nodeVar215 );
	nodeVar217 = nodeVar216;
	nodeVar218 = ( singleScatteringDielectric + multiScatteringDielectric );
	nodeVar219 = ( vec3<f32>( 1.0 ) - nodeVar218 );
	nodeVar220 = nodeVar219;
	nodeVar221 = ( DiffuseContribution * nodeVar220 );
	nodeVar222 = ( nodeVar221 * nodeVar214 );
	nodeVar223 = nodeVar222;
	indirectSpecular = vec3<f32>( 0.0, 0.0, 0.0 );
	nodeVar224 = ( indirectSpecular + nodeVar217 );
	indirectSpecular = nodeVar224;
	nodeVar225 = ( indirectDiffuse + nodeVar223 );
	indirectDiffuse = nodeVar225;
	ambientOcclusion = 1.0;
	nodeVar226 = ( indirectDiffuse * vec3<f32>( ambientOcclusion ) );
	indirectDiffuse = nodeVar226;
	nodeVar227 = dot( normalView, positionViewDirection );
	nodeVar228 = ( clamp( nodeVar227, 0.0, 1.0 ) + ambientOcclusion );
	nodeVar229 = ( Roughness * -16.0 );
	nodeVar230 = ( 1.0 - nodeVar229 );
	nodeVar231 = nodeVar230;
	nodeVar232 = ( - nodeVar231 );
	nodeVar233 = exp2( nodeVar232 );
	nodeVar234 = pow( nodeVar228, nodeVar233 );
	nodeVar235 = ( 1.0 - nodeVar234 );
	nodeVar236 = nodeVar235;
	nodeVar237 = ( ambientOcclusion - nodeVar236 );
	nodeVar238 = ( indirectSpecular * vec3<f32>( clamp( nodeVar237, 0.0, 1.0 ) ) );
	indirectSpecular = nodeVar238;
	nodeVar239 = ( directDiffuse + indirectDiffuse );
	totalDiffuse = nodeVar239;
	nodeVar240 = ( directSpecular + indirectSpecular );
	totalSpecular = nodeVar240;
	nodeVar241 = ( totalDiffuse + totalSpecular );
	outgoingLight = nodeVar241;
	Output = max( vec4<f32>( ( outgoingLight + EmissiveColor ), DiffuseColor.w ), vec4<f32>( 0.0 ) );
	nodeVar242 = ( - v_positionView.z );
	let nodeConst0 = max( ( 3.0 - v_positionWorld.y ), 0.0 );
	let nodeConst1 = ( nodeConst0 * ( - v_positionView.z ) );
	nodeVar243 = vec4<f32>( mix( Output.xyz, mix( object.nodeUniform47, object.nodeUniform48, pow( clamp( dot( normalize( ( v_positionWorld - render.cameraPosition ) ), object.nodeUniform49 ), 0.0, 1.0 ), 2.5 ) ), ( 1.0 - ( ( 1.0 - ( 1.0 - exp( ( - ( ( ( object.nodeUniform50 * object.nodeUniform50 ) * nodeVar242 ) * nodeVar242 ) ) ) ) ) * ( 1.0 - ( 1.0 - exp( ( - ( ( ( 0.0025 * 0.0025 ) * nodeConst1 ) * nodeConst1 ) ) ) ) ) ) ) ), Output.w );
	Output = nodeVar243;

	// result

	output.color = nodeVar243;

	return output;

}
